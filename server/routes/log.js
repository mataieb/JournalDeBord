const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(requireAuth);

// Helper to get start/end of day
const getDayRange = (dateStr) => {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// Async Handler helper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Ensures the given item belongs (via its dayLog) to the authenticated user.
// model must expose a `dayLog` relation directly (FoodItem, DrinkItem, HabitItem, Exercise).
const assertOwnsDayLogItem = async (model, id, req) => {
    const item = await model.findUnique({
        where: { id: parseInt(id) },
        select: { id: true, dayLog: { select: { userId: true } } }
    });
    return !!item && item.dayLog.userId === req.userId;
};

// StoolEntry -> GutHealth -> DayLog, one hop deeper than the other items.
const assertOwnsStool = async (id, req) => {
    const item = await prisma.stoolEntry.findUnique({
        where: { id: parseInt(id) },
        select: { id: true, gutHealth: { select: { dayLog: { select: { userId: true } } } } }
    });
    return !!item && item.gutHealth.dayLog.userId === req.userId;
};


// GET /api/log/:date (YYYY-MM-DD or today)
router.get('/:date', asyncHandler(async (req, res) => {
    const { date } = req.params;
    const { start, end } = getDayRange(date);

    const log = await prisma.dayLog.findFirst({
        where: {
            userId: req.userId,
            date: { gte: start, lte: end }
        },
        include: {
            foods: true,
            drinks: true,
            habits: true,
            exercises: true,
            sleep: true,
            gutHealth: {
                include: {
                    stools: { orderBy: { time: 'asc' } }
                }
            }
        }
    });

    res.json(log || { date, foods: [], drinks: [], habits: [], exercises: [], gutHealth: null, sleep: null });
}));

// GET /api/log/month/:year/:month
router.get('/month/:year/:month', asyncHandler(async (req, res) => {
    const { year, month } = req.params;

    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    const logs = await prisma.dayLog.findMany({
        where: {
            userId: req.userId,
            date: { gte: start, lte: end }
        },
        select: {
            date: true,
            gutHealth: { select: { dailyScore: true } },
            sleep: { select: { quality: true } }
        }
    });

    const data = logs.map(l => ({
        date: l.date.toISOString().split('T')[0],
        gutScore: l.gutHealth?.dailyScore || null,
        sleepScore: l.sleep?.quality || null
    }));

    res.json(data);
}));

// POST /api/log/item
router.post('/item', asyncHandler(async (req, res) => {
    const { type, data, date } = req.body;
    const { start, end } = getDayRange(date);

    let log = await prisma.dayLog.findFirst({
        where: {
            userId: req.userId,
            date: { gte: start, lte: end }
        }
    });

    if (!log) {
        log = await prisma.dayLog.create({
            data: {
                userId: req.userId,
                date: new Date(date)
            }
        });
    }

    let result;
    if (type === 'food') {
        result = await prisma.foodItem.create({
            data: {
                ...data,
                dayLogId: log.id,
                time: data.time ? new Date(data.time) : new Date()
            }
        });
    } else if (type === 'drink') {
        result = await prisma.drinkItem.create({
            data: {
                ...data,
                dayLogId: log.id,
                time: data.time ? new Date(data.time) : new Date()
            }
        });
    } else if (type === 'habit') {
        result = await prisma.habitItem.create({
            data: { ...data, dayLogId: log.id, time: new Date() }
        });
    } else if (type === 'exercise') {
        result = await prisma.exercise.create({
            data: { ...data, dayLogId: log.id }
        });
    } else if (type === 'gutHealth') {
        result = await prisma.gutHealth.upsert({
            where: { dayLogId: log.id },
            update: {
                dailyScore: data.dailyScore,
                symptoms: data.symptoms
            },
            create: {
                dayLogId: log.id,
                dailyScore: data.dailyScore,
                symptoms: data.symptoms
            }
        });
    } else if (type === 'stool') {
        let gutHealth = await prisma.gutHealth.findUnique({
            where: { dayLogId: log.id }
        });

        if (!gutHealth) {
            gutHealth = await prisma.gutHealth.create({
                data: { dayLogId: log.id }
            });
        }

        result = await prisma.stoolEntry.create({
            data: {
                gutHealthId: gutHealth.id,
                bristolType: data.bristolType,
                notes: data.notes,
                time: data.time ? new Date(data.time) : new Date()
            }
        });
    } else if (type === 'sleep') {
        result = await prisma.sleep.upsert({
            where: { dayLogId: log.id },
            update: {
                bedtime: data.bedtime ? new Date(data.bedtime) : undefined,
                waketime: data.waketime ? new Date(data.waketime) : undefined,
                score: data.score ? parseInt(data.score) : undefined,
                quality: data.quality ? parseInt(data.quality) : undefined
            },
            create: {
                dayLogId: log.id,
                bedtime: data.bedtime ? new Date(data.bedtime) : undefined,
                waketime: data.waketime ? new Date(data.waketime) : undefined,
                score: data.score ? parseInt(data.score) : undefined,
                quality: data.quality ? parseInt(data.quality) : undefined
            }
        });
    }

    res.json(result);
}));

// PUT /api/log/stool/:id
router.put('/stool/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsStool(id, req))) return res.status(404).json({ message: 'Not found' });
    const { bristolType, notes, time } = req.body;

    const result = await prisma.stoolEntry.update({
        where: { id: parseInt(id) },
        data: {
            bristolType: parseInt(bristolType),
            notes,
            time: time ? new Date(time) : undefined
        }
    });
    res.json(result);
}));

// DELETE /api/log/stool/:id
router.delete('/stool/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsStool(id, req))) return res.status(404).json({ message: 'Not found' });
    await prisma.stoolEntry.delete({
        where: { id: parseInt(id) }
    });
    res.json({ success: true });
}));

// FOOD Routes
router.put('/food/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsDayLogItem(prisma.foodItem, id, req))) return res.status(404).json({ message: 'Not found' });
    const { name, category, calories, quantity, time } = req.body;
    const result = await prisma.foodItem.update({
        where: { id: parseInt(id) },
        data: {
            name, category, quantity,
            calories: calories ? parseInt(calories) : undefined,
            time: time ? new Date(time) : undefined
        }
    });
    res.json(result);
}));

router.delete('/food/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsDayLogItem(prisma.foodItem, id, req))) return res.status(404).json({ message: 'Not found' });
    await prisma.foodItem.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
}));

// DRINK Routes
router.put('/drink/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsDayLogItem(prisma.drinkItem, id, req))) return res.status(404).json({ message: 'Not found' });
    const { name, type, period, volumeMl, time } = req.body;
    const result = await prisma.drinkItem.update({
        where: { id: parseInt(id) },
        data: {
            name, type, period,
            volumeMl: volumeMl ? parseInt(volumeMl) : undefined,
            time: time ? new Date(time) : undefined
        }
    });
    res.json(result);
}));

router.delete('/drink/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsDayLogItem(prisma.drinkItem, id, req))) return res.status(404).json({ message: 'Not found' });
    await prisma.drinkItem.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
}));

// EXERCISE Routes
router.put('/exercise/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsDayLogItem(prisma.exercise, id, req))) return res.status(404).json({ message: 'Not found' });
    const { name, type, durationMin } = req.body;
    const result = await prisma.exercise.update({
        where: { id: parseInt(id) },
        data: {
            name, type,
            durationMin: durationMin ? parseInt(durationMin) : undefined
        }
    });
    res.json(result);
}));

router.delete('/exercise/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsDayLogItem(prisma.exercise, id, req))) return res.status(404).json({ message: 'Not found' });
    await prisma.exercise.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
}));

// HABIT Routes
router.put('/habit/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsDayLogItem(prisma.habitItem, id, req))) return res.status(404).json({ message: 'Not found' });
    const { name, category, quantity } = req.body;
    const result = await prisma.habitItem.update({
        where: { id: parseInt(id) },
        data: {
            name, category,
            quantity: quantity ? parseInt(quantity) : undefined
        }
    });
    res.json(result);
}));

router.delete('/habit/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!(await assertOwnsDayLogItem(prisma.habitItem, id, req))) return res.status(404).json({ message: 'Not found' });
    await prisma.habitItem.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
}));

module.exports = router;

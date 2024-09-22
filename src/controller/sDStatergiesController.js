const { catchAsyncError } = require("../utils");


const schedulerManager = require("../SchedulerManager/schedulerManager");
const { sdStatergy } = require("../strategies/sdStatergy");
const ErrorHandler = require("../Error/ErrorHandler");
const Statergy = require("../db/models/Statergy");
const { default: mongoose } = require("mongoose");
const SdFilteredStock = require("../db/models/SdFilteredStock");

exports.getSdStatergysAction = catchAsyncError(async (req, res, next) => {

    const { type } = req.query;

    const statergies = await Statergy.find({
        statergyName: 'SD',
        type
    });

    res.status(200).json({
        success: true,
        data: statergies,
        message: "SD statergies fetched successfully"
    })
});


exports.addSdStatergyAction = catchAsyncError(async (req, res, next) => {
    const { timeFrame, level = false, type, query = {} } = req.body;

    console.log('query', query)

    const statergyName = `SD-${timeFrame}-${query?.index}-${type}`;

    const existingStatergy = await Statergy.findOne({
        statergyName: 'SD',
        name: statergyName,
        type: type
    }).lean();

    if (existingStatergy) {
        return next(new ErrorHandler("Statergy already exist"));
    }

    const eventName = type === 'INTERVAL' ? `SD${timeFrame}INTERVAL` : null

    await Statergy.create({
        statergyName: 'SD',
        name: statergyName,
        type: type,
        timeFrame,
        eventName,
        query: query,
        fields: {
            level: level
        },
    })


    res.status(200).json({
        success: true,
        message: "Statergy created successfully"
    })
});


exports.runSdStatergyAction = catchAsyncError(async (req, res, next) => {

    const { id } = req.body;

    const statergy = await Statergy.findById(id);
    if (statergy) {

        if (schedulerManager.listJobs().includes(statergy.name)) {
            return next(new ErrorHandler("Statergy already running", 400))
        }

        schedulerManager.addJob(statergy.name, {
            initialHour: 9,
            initialMinute: 16,
            intervalMinutes: 5,
            jobFunction: sdStatergy.bind(null, {
                statergy
            })
        });

        statergy.running = true;
        await statergy.save();

        return res.status(200).json({
            success: true,
            message: "Statergy run successfully"
        })

    }

    res.status(200).json({
        status: 400,
        message: "No statergy found!"
    })

});

exports.stopSdStatergyAction = catchAsyncError(async (req, res, next) => {
    const { id } = req.body;

    const statergy = await Statergy.findById(id);

    if (!statergy) {
        return next(new ErrorHandler("Statergy not found!", 400))
    }

    schedulerManager.removeJob(statergy.name);
    schedulerManager.removeJobGroup(statergy.name);

    statergy.running = false;
    await statergy.save();

    res.status(200).json({
        success: true,
        message: "Statergy stopped successfully!"
    });
})


exports.deleteSdStatergyAction = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    // Find and delete the strategy in one query
    const statergy = await Statergy.findByIdAndDelete(id);

    if (!statergy) {
        return res.status(404).json({
            success: false,
            message: "Statergy not found!"
        });
    }

    // Remove the associated jobs and job group
    schedulerManager.removeJob(statergy.name);
    schedulerManager.removeJobGroup(statergy.name);


    res.status(200).json({
        success: true,
        message: "Statergy deleted successfully!"
    });
});


exports.updateSdStatergyAction = catchAsyncError(async (req, res, next) => {
    const { name, level, query, type, id } = req.body;

    const statergy = await Statergy.findById(id);

    if (schedulerManager.listJobs().includes(statergy.name)) {
        return next(new ErrorHandler("Statergy is running please stop before!", 400))
    }

    statergy.name = name || statergy.name,
        statergy.type = type || statergy.type,
        statergy.fields = {
            level: level || statergy.level,
        },
        statergy.query = query || statergy.query || {}

    await statergy.save();

    res.status(200).json({
        success: true,
        message: "Statergies updated successfully!"
    });
})

exports.startRunningStatergy = catchAsyncError(async (req, res, next) => {

    // Find all running strategies with matching _ids
    const strategies = await Statergy.find({
        running: true,
        type: "INTERVAL"
    }).lean();

    let message = '';

    // Add jobs for strategies that are not already scheduled
    strategies?.forEach(statergy => {
        if (!schedulerManager.listJobs().includes(statergy.name)) {

            schedulerManager.addJob(statergy.name, {
                initialHour: 9,
                initialMinute: 16,
                intervalMinutes: 5,
                jobFunction: sdStatergy.bind(null, {
                    statergy
                })
            });

            message = "Strategies run successfully!"
        }
    });

    // Return success response
    return res.status(200).json({
        success: true,
        message: message
    });
});

exports.getSdFilteredData = catchAsyncError(async (req, res, next) => {
    const { sid } = req.params;
    const data = await SdFilteredStock.find({
        sid
    });

    res.status(200).json({
        success: true,
        data
    })
})

exports.runSdFilterAction = catchAsyncError(async(req, res, next) => {
    const { id } = req.query;

    console.log('id', id)
    const filter = await Statergy.findById(id);
    if(!filter) {
        return next(new ErrorHandler("No filter found!", 400));
    }
    
    const data = await sdStatergy({
        statergy: filter
    });

    res.status(200).json({
        success: true,
        data
    })
})
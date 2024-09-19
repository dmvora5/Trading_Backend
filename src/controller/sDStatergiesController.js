const { catchAsyncError } = require("../utils");


const schedulerManager = require("../SchedulerManager/schedulerManager");
const { sdStatergy } = require("../strategies/sdStatergy");
const ErrorHandler = require("../Error/ErrorHandler");
const Statergy = require("../db/models/Statergy");

exports.getSdStatergysAction = catchAsyncError(async (req, res, next) => {
    const statergies = await Statergy.find({
        statergyName: 'SD'
    });

    res.status(200).json({
        success: true,
        data: statergies,
        message: "SD statergies fetched successfully"
    })
});


exports.addSdStatergyAction = catchAsyncError(async (req, res, next) => {
    const { timeFrame, eventName, level = false, type, query = {} } = req.body;

    const statergyName = `SD-${timeFrame}`;

    const existingStatergy = await Statergy.findOne({
        statergyName: 'SD',
        name: statergyName
    }).lean();

    if(existingStatergy) {
        return next(new ErrorHandler("Statergy already exist"));
    }

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

    const statergy = await Statergy.findById(id).lean();
    if (statergy) {

        if (schedulerManager.listJobs().includes(statergy.name)) {
            return next(new ErrorHandler("Statergy already running", 400))
        }

        schedulerManager.addJob(statergy.name, {
            initialHour: 9,
            initialMinute: 16,
            intervalMinutes: 5,
            jobFunction: sdStatergy.bind(null, {
                timeFrame: statergy.timeFrame,
                query: statergy.query,
                eventName: statergy.eventName,
                level: statergy?.fields?.level === 'true' ? true : false
            })
        });

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

exports.stopSdStatergyAction = catchAsyncError(async(req, res, next) => {
    const { name } = req.body;

    schedulerManager.removeJob(name);
    schedulerManager.removeJobGroup(name);
    res.status(200).json({
        success: true,
        message: "Statergy stopped successfully!"
    });
})


exports.deleteSdStatergyAction = catchAsyncError(async(req, res, next) => {
    const { id } = req.body;

    await Statergy.findByIdAndDelete(id)

    schedulerManager.removeJob(name);
    schedulerManager.removeJobGroup(name);
    res.status(200).json({
        success: true,
        message: "Statergy delete successfully!"
    });
});


exports.updateSdStatergyAction = catchAsyncError(async (req, res, next) => {
    const { name, level, query, type, id } = req.body;

    const statergy = await Statergy.findById(id);

    if (schedulerManager.listJobs().includes(statergy.name)) {
        return next(new ErrorHandler("Statergy is running please stop before!", 400))
    }

        statergy.name= name || statergy.name,
        statergy.type= type || statergy.type,
        statergy.fields= {
            level: level || statergy.level,
        },
        statergy.query= query || statergy.query || {}
    
        await statergy.save();

    res.status(200).json({
        success: true,
        message: "Statergies updated successfully!"
    });
})
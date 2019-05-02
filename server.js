const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
const User = require('./models/User')
const Exercise = require('./models/Exercise')

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))

mongoose.connect(process.env.MLAB_URI, (err) => {
    if (err) {
        console.log(err)
    }
    const listener = app.listen(process.env.PORT || 3000, () => {
        console.log('Your app is listening on port ' + listener.address().port)
    })
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
})
app.get('/api/exercise/users', (req, res) => {
    User.find((err, users) => {
        if (err) {
            res.sendStatus(500)
        }
        res.send(users)
    })
})
app.get('/api/exercise/log', (req, res) => {
    User.findById(req.query.userId, (err, user) => {
        if (err) {
            res.sendStatus(500)
        }
        let query = Exercise.find()
        let options = {userId: req.query.userId}
        if (req.query.from || req.query.to) {
            options.date = {}
            if (req.query.from) {
                query = Exercise.find().where('date').gte(req.query.from)
            }
            if (req.query.to) {
                query = Exercise.find().where('date').lte(req.query.to)
            }
            if (req.query.from && req.query.to) {
                query = Exercise.find().where('date').gte(req.query.from).lte(req.query.to)
            }
        }
        if (req.query.limit) {
            query.limit(Number(req.query.limit))
        }
        console.log(query.getQuery())
        query.exec((err, exercises) => {
            if (err) {
                res.sendStatus(500)
            }

            res.send({user, exercises, count: exercises.length})
        })
    })
})

app.post('/api/exercise/new-user', (req, res) => {
    let newUser = new User({username: req.body.username})
    newUser.save((e, newUser) => {
        if (e) {
            res.sendStatus(500)
        }
        res.send(newUser)
    })
})
app.post('/api/exercise/add', (req, res) => {
    let newExercise = new Exercise({
        userId: req.body.userId,
        duration: req.body.duration,
        description: req.body.description
    })
    if (req.body.date) {
        newExercise.date = req.body.date
    }
    newExercise.save((e, newExercise) => {
        if (e) {
            res.sendStatus(500)
        }
        User.findById(req.body.userId, (err, user) => {
            if (err) {
                res.sendStatus(500)
            }
            user.exercise = newExercise
            res.send(user)
        })
    })
})


// Not found middleware
app.use((req, res, next) => {
    return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }
    let errCode, errMessage

    if (err.errors) {
        // mongoose validation error
        errCode = 400 // bad request
        const keys = Object.keys(err.errors)
        // report the first validation error
        errMessage = err.errors[keys[0]].message
    } else {
        // generic or custom error
        errCode = err.status || 500
        errMessage = err.message || 'Internal Server Error'
    }
    res.status(errCode).type('txt')
        .send(errMessage)
})

const express         = require('express');
const cors            = require('cors');
const morgan          = require('morgan');
const cookieParser    = require('cookie-parser');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Module routes are mounted here as they are created, e.g.:
// app.use('/api/categories', require('./modules/categories/categories.routes'));

app.use(errorMiddleware);

module.exports = app;

const express = require('express');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// connections
const dbConnect = require('./config/database');
dbConnect.connect();

const { cloudinaryConnect } = require('./config/cloudinary');
cloudinaryConnect();

// import routes
const userRouter = require('./routes/User');
const courseRouter = require('./routes/Course');
const profileRouter = require('./routes/Profile');
// const paymentRouter = require('./routes/Payment');

const PORT = 3000;

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp',
  })
);

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// routes initialized
app.use('/api/v1/auth', userRouter);
// app.use('/api/v1/payment', paymentRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/course', courseRouter);

// server test endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(PORT, () => {
  console.log(`App is running on port: ${PORT}`);
});

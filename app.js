const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const Blog = require('./models/blogs');
const User = require('./models/User');
const fileUpload = require('express-fileupload');
const fstream = require('fstream');
const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const fs = require('fs');
const jwt = require('jsonwebtoken');
const MongoID = require('lite-id');
const path = require('path');
const notifier = require('node-notifier');

const app = express();

// middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());

// view engine
app.set('view engine', 'ejs');

// database connection
const dbURI = 'mongodb+srv://PDTM:PD20720@nodetuts.p3ehk.mongodb.net/nodeauth';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));

// routes
app.get('*', checkUser);
app.get('/', (req, res) => res.render('home', { title: 'Welcome' }));
app.get('/allfiles', requireAuth, (req, res) => {
    const code = req.cookies.jwt;
    const decoded = jwt.verify(code, 'net ninja secret');
    const Id = decoded.id;

    Blog.find().sort({ createdAt: -1 })
        .then((result) => {
            let Result = [];
            for (let i = 0; i < result.length; i++) {
                const IdFor = result[i].id;
                if (!IdFor.includes(`${Id}`)) {
                    Result = Result.concat(result[i]);
                }
            }
            res.render('allfiles', { title: 'All Files', blogs: Result })
        })
        .catch((err) => {
            console.log(err);
        })

});

app.get('/myfiles', requireAuth, (req, res) => {
    const code = req.cookies.jwt;
    const decoded = jwt.verify(code, 'net ninja secret');
    const Id = decoded.id;

    Blog.find().sort({ createdAt: -1 })
        .then((result) => {
            let Result = [];
            for (let i = 0; i < result.length; i++) {
                const IdFor = result[i].id;
                if (IdFor.includes(`${Id}`)) {
                    Result = Result.concat(result[i]);
                }
            }
            res.render('myfiles', { title: 'My Files', blogs: Result })
        })
        .catch((err) => {
            console.log(err);
        })
});

app.post('/myfiles', (req, res) => {
    const code = req.cookies.jwt;
    const decoded = jwt.verify(code, 'net ninja secret');
    const Id = decoded.id;

    const ID = MongoID(20);
    const MongoDBId = `${Id}${ID}`;

    const encryptPassword = req.body.securtyKey;

    let sampleFile;
    let uploadPath;
    sampleFile = req.files.sampleFile;
    uploadPath = __dirname + '/files' + sampleFile.name;
    sampleFile.mv(uploadPath, function(err) {
        if (err)
            return res.status(500).send(err);
    });

    const encryptPath = `${__dirname}/files/EncryptFiles/${Id}-${sampleFile.name}`;
    const read = fstream.Reader(uploadPath);
    const encrypt = crypto.createCipher("aes-256-ctr", encryptPassword);
    const writer = fstream.Writer(encryptPath);

    read.pipe(encrypt).pipe(writer);

    let fileName = req.body.sampleFile;
    fileName = encryptPath;

    const SecurityKey = CryptoJS.AES.encrypt(req.body.securtyKey, 'secret key 123').toString();

    Blog.init()
    const blog = new Blog({
        _id: MongoDBId,
        name: req.body.name,
        description: req.body.description,
        sampleFile: fileName,
        securtyKey: SecurityKey,
        date: req.body.date,
        userEmail1: req.body.email
    });
    blog.save()
        .then((result) => {
            fs.unlinkSync(uploadPath)
            res.redirect('/myfiles');
        }).catch((err) => {
            console.log(err);
        })
})

app.get('/upload', requireAuth, (req, res) => {
    const code = req.cookies.jwt;
    const decoded = jwt.verify(code, 'net ninja secret');
    const Id = decoded.id;

    let userEmail;
    let userId;
    User.find()
        .then((result) => {
            for (let i = 0; i < result.length; i++) {
                userId = result[i]._id;
                if (userId == Id) {
                    userEmail = result[i].email;
                }
            }
            res.render('upload', { title: 'Upload Files', Email: userEmail });
        })
        .catch((err) => {
            console.log(err);
        })
});
app.get('/allfiles/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    Blog.findById(id)
        .then((result) => {
            const key = result.securtyKey;

            var bytes = CryptoJS.AES.decrypt(key, 'secret key 123');
            var keyValue = bytes.toString(CryptoJS.enc.Utf8);

            res.render('filedetail', { title: 'File Details', blog: result, Value: keyValue });
        }).catch((err) => {
            console.log(err);
        });
});

app.get('/myfiles/:id/download', requireAuth, (req, res) => {
    const id = req.params.id;
    Blog.findById(id)
        .then((result) => {
            const id = result._id;
            const encPath = result.sampleFile;
            const nameFile = path.basename(encPath);

            const securityKey = result.securtyKey;

            var bytes = CryptoJS.AES.decrypt(securityKey, 'secret key 123');
            var keyValue = bytes.toString(CryptoJS.enc.Utf8);

            const decryptPath = `C:/Users/ASUS/Downloads/${nameFile}`;

            var read = fstream.Reader(encPath);
            var decrypt = crypto.createDecipher("aes-256-ctr", keyValue);
            var writer = fstream.Writer(decryptPath);
            read.pipe(decrypt).pipe(writer);

            notifier.notify({
                title: 'File Sharing App',
                message: 'Your File Successfully Downloaded..!',
                icon: path.join(__dirname, '/public/file.png'),
                sound: false,
                wait: true
            });

        }).catch((err) => {
            console.log(err);
        });
    res.redirect('/myfiles');
});

app.get('/allfiles/:id/download', requireAuth, (req, res) => {
    const id = req.params.id;
    Blog.findById(id)
        .then((result) => {
            const id = result._id;
            const encPath = result.sampleFile;
            const nameFile = path.basename(encPath);

            const securityKey = result.securtyKey;

            var bytes = CryptoJS.AES.decrypt(securityKey, 'secret key 123');
            var keyValue = bytes.toString(CryptoJS.enc.Utf8);

            const decryptPath = `C:/Users/ASUS/Downloads/${nameFile}`;

            var read = fstream.Reader(encPath);
            var decrypt = crypto.createDecipher("aes-256-ctr", keyValue);
            var writer = fstream.Writer(decryptPath);
            read.pipe(decrypt).pipe(writer);

            notifier.notify({
                title: 'File Sharing App',
                message: 'Your File Successfully Downloaded..!',
                icon: path.join(__dirname, '/public/file.png'),
                sound: false,
                wait: true
            });

        }).catch((err) => {
            console.log(err);
        });
    res.redirect('/allfiles');
});

app.get('/myfiles/:id', requireAuth, (req, res) => {
    const id = req.params.id;

    Blog.findById(id)
        .then((result) => {
            res.render('myfiledetail', { title: 'File Details', blog: result });
        }).catch((err) => {
            console.log(err);
        });
});

app.delete('/myfiles/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    Blog.findByIdAndDelete(id)
        .then((result) => {
            const FilePath = result.sampleFile;
            fs.unlinkSync(FilePath);
            res.json({ redirect: '/myfiles/' });
        })
        .catch((err) => {
            console.log(err);
        })
})

app.use(authRoutes);

//404 page
app.use(requireAuth, (req, res) => res.status(404).render('404', { title: '404' }));
const express = require('express')
const path = require('path')
const { get } = require('request')
const cors = require('cors'); // Import the cors middleware
const fs = require('fs');
const fs1 = require('fs').promises;
const multer = require('multer');
const moment = require('moment');
const mysql = require('mysql');
const app = express()

const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'face_info',
});

// Connect to the database
con.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, './public')))
app.use(express.static(path.join(__dirname, '../images')))
app.use(express.static(path.join(__dirname, '../media')))
app.use(express.static(path.join(__dirname, '../../weights')))
app.use(express.static(path.join(__dirname, '../../dist')))

app.get('/', (req, res) => res.redirect('/people_age_chart'))
app.get('/face_detection', (req, res) => res.sendFile(path.join(viewsDir, 'faceDetection.html')))
app.get('/people_count', (req, res) => res.sendFile(path.join(viewsDir, 'peoplecount.html')))
app.get('/people_age_chart', (req, res) => res.sendFile(path.join(viewsDir, 'people_age_chart.html')))
app.get('/people_gender_chart', (req, res) => res.sendFile(path.join(viewsDir, 'people_gender_chart.html')))
app.get('/age_category_chart', (req, res) => res.sendFile(path.join(viewsDir, 'age_category_chart.html')))
app.get('/averge_time_people_vistited', (req, res) => res.sendFile(path.join(viewsDir, 'averge_time_people_vistited.html')))
app.get('/gender_dis_analysis', (req, res) => res.sendFile(path.join(viewsDir, 'gender_dis_analysis.html')))
app.get('/face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'faceLandmarkDetection.html')))
app.get('/face_expression_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'faceExpressionRecognition.html')))
app.get('/age_and_gender_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'ageAndGenderRecognition.html')))
app.get('/face_extraction', (req, res) => res.sendFile(path.join(viewsDir, 'faceExtraction.html')))
app.get('/face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'faceRecognition.html')))
app.get('/video_face_tracking', (req, res) => res.sendFile(path.join(viewsDir, 'videoFaceTracking.html')))
app.get('/webcam_face_detection', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceDetection.html')))
app.get('/webcam_face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceLandmarkDetection.html')))
app.get('/webcam_face_expression_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceExpressionRecognition.html')))
app.get('/webcam_age_and_gender_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'webcamAgeAndGenderRecognition.html')))
app.get('/bbt_face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceLandmarkDetection.html')))
app.get('/bbt_face_similarity', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceSimilarity.html')))
app.get('/bbt_face_matching', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceMatching.html')))
app.get('/bbt_face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceRecognition.html')))
app.get('/batch_face_landmarks', (req, res) => res.sendFile(path.join(viewsDir, 'batchFaceLandmarks.html')))
app.get('/batch_face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'batchFaceRecognition.html')))


const currentDate = new Date();
const year = currentDate.getFullYear();
const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
const day = currentDate.getDate().toString().padStart(2, '0');

const imagesFolderPath = `../images/faces/${year}-${month}-${day}`;
app.post('/insertData', (req, res) => {
  const face_list = req.body.face_list;

  if (!Array.isArray(face_list) || face_list.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing face_list in the request body' });
  }

  face_list.forEach((face) => {
    const parts = face.split('_');
    const date = parts[0];
    const hour = parts[1];
    const minute = parts[2];
    const second = parts[3];
    const timestamp = `${hour}:${minute}:${second}`;
    const age = parts[4];
    const gen = parts[5];
    const gender=gen.split('.')

    con.query('SELECT * FROM person_details WHERE date = ? AND img_path = ?', [date, face], function (error, results, fields) 
    {

    if (results.length === 0) 
    {
        const sql = 'INSERT INTO `person_details`(`date`, `time`, `age`, `gender`,`img_path`) VALUES (?, ?, ?, ?,?)';
        con.query(sql, [date, timestamp, age, gender[0],face], (insertErr, result) => {
          if (insertErr) {
            console.error('Error inserting into the database:', insertErr);
          } else {
            console.log('Inserted into the database:', result);
          }
          } 
    )}
  });
  });

  res.status(200).json({ message: 'Data inserted successfully' });
});


app.get('/gender_dis_analy', (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const query = `SELECT gender, COUNT(*) as count, date
                 FROM person_details
                 WHERE date BETWEEN ? AND ?
                 GROUP BY gender, date`;
 
  con.query(query, [startDate, endDate], (err, results) => {
      if (err) {
          console.error('Error executing query: ' + err.stack);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }

      res.json(results);
  });
});

// Define a route to fetch age and count data
app.post('/people_age', (req, res) => {
  const selectedDate = req.body.selectedDate;
  const query = "SELECT age, COUNT(*) as count FROM person_details where date=? GROUP BY age";
  con.query(query,[selectedDate],(error, results,fields) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json(results);
  });
});


app.get('/categorize_ages', (req, res) => {
  const selectedDate = req.query.selectedDate;

  const query = `
  SELECT age FROM person_details
  WHERE date = ?
`;

  con.query(query, [selectedDate], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Process the results and categorize ages for the particular date
    const categorizedAges = categorizeAges(results);

    // Respond with the categorized data
    res.json(categorizedAges);
  });
});

function categorizeAges(ages) {
  const categories = {
    child: 0,
    adult: 0,
    middleAge: 0,
    seniorCitizen: 0,
  };

  ages.forEach((rowDataPacket) => {
    const age = rowDataPacket.age; // Access the age property
  
    if (age < 15) {
      categories.child++;
    } else if (age >= 16 && age <= 29) {
      categories.adult++;
    } else if (age >= 30 && age <= 49) {
      categories.middleAge++;
    } else {
      categories.seniorCitizen++;
    }
  });

  return categories;
}



app.post('/people_gender', (req, res) => {
  const selectedDate = req.body.selectedDate;
  const query = "SELECT gender,COUNT(*) as count FROM person_details where date=? GROUP BY gender";
  con.query(query,[selectedDate],(error, results,fields) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      res.status(500).send('Internal Server Error');
      return;
    }

    res.json(results);
  });
});

// Define a route to fetch data from MySQL
app.get('/average_time/:selectedDate', (req, res) => {
  const selectedDate = req.params.selectedDate;

  // Replace 'your_table' with your actual table name
  const query = `SELECT date, time, COUNT(*) as visit_count FROM person_details WHERE date = '${selectedDate}' GROUP BY time`;

  con.query(query, (error, results) => {
    if (error) throw error;

    // Calculate the average time with the most visits
    const averageTime = calculateAverageTime(results);

    // Send the data and average time to the client
    res.json({ data: results, averageTime });
  });
});

function calculateAverageTime(data) {
  let mostVisits = 0;
  let mostVisitsTime = '';

  data.forEach(entry => {
    const visitCount = entry.visit_count;
    if (visitCount > mostVisits) {
      mostVisits = visitCount;
      mostVisitsTime = entry.time;
    }
  });

  return mostVisitsTime;
}


app.post('/people_count', (req, res) => {

  const selectedDate = req.body.selectedDate;
  const imageFolder = `../images/faces/${selectedDate}`;

  const selectQuery = 'SELECT id, img_path FROM person_details WHERE date=?';

  con.query(selectQuery,[selectedDate],(error, results, fields) => {

    results.forEach((row) => {
      const imagePath = row.img_path;
      const imageFullPath = `${imageFolder}/${imagePath}`;

      fs.access(imageFullPath, fs.constants.F_OK, (err) => {
        if (err) {
          // Image file does not exist, delete the record from the database
          const deleteQuery = 'DELETE FROM person_details WHERE id = ?';

          con.query(deleteQuery, [row.id], (deleteError, deleteResults, deleteFields) => {
            if (deleteError) {
              console.error('Error deleting record:', deleteError);
            } else {
              console.log(`Record deleted for image: ${imagePath}`);
            }
          });
        }
      });
    });
  });


  if (!selectedDate) {
    res.status(400).send('Bad Request: Date is required');
    return;
  }

  const query = "SELECT  distinct `date`, `time`, `age`, `gender`, `img_path` FROM `person_details` WHERE date =?";

  con.query(query, [selectedDate], (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      res.status(500).send('Internal Server Error');
      return;
    }

    res.json(results);
  });
});


app.use(cors());

app.get('/image-names', (req, res) => {
  fs.readdir(imagesFolderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    const imageNames = files.filter(name => name.endsWith('.jpg') || name.endsWith('.png'));
    res.json(imageNames);
  });
});


app.use(cors());

// Set up storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files
app.use(express.static('public'));

// Handle POST request to /save_img
app.post('/save_img', upload.single('image'), (req, res) => {
  const imageBuffer = req.file.buffer;
  const age = req.body.age;
  const gender = req.body.gender;
  const genderProbability = req.body.genderProbability;
  const directoryName = `../images/faces/${year}-${month}-${day}`;
  const directoryPath = path.join(__dirname, directoryName);
  // Check if the directory already exists
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }

  const cDate = moment().format('YYYY-MM-DD_HH_mm_ss');
  const fileName = `${cDate}_${age}_${gender}.png`;
  const filePath = path.join(__dirname,`../images/faces/${year}-${month}-${day}/`, fileName);
  require('fs').writeFileSync(filePath, imageBuffer);
  console.log('Face information saved successfully:', fileName);
  res.status(200).json({ success: true, fileName: fileName });
});


app.post('/compare-faces', async (req, res) => {
  const face1 = req.body.face1;
  try {
      await fs1.unlink(`../images/${face1}`);
      res.json({ success: true, message: 'Image deleted successfully' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error comparing faces' });
  }
});


app.post('/fetch_external_image', async (req, res) => {
  const { imageUrl } = req.body
  if (!imageUrl) {
    return res.status(400).send('imageUrl param required')
  }
  try {
    const externalResponse = await request(imageUrl)
    res.set('content-type', externalResponse.headers['content-type'])
    return res.status(202).send(Buffer.from(externalResponse.body))
  } catch (err) {
    return res.status(404).send(err.toString())
  }
})

app.listen(3000, () => console.log('Listening on port 3000!'))

function request(url, returnBuffer = true, timeout = 10000) {
  return new Promise(function(resolve, reject) {
    const options = Object.assign(
      {},
      {
        url,
        isBuffer: true,
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
        }
      },
      returnBuffer ? { encoding: null } : {}
    )

    get(options, function(err, res) {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}


const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const dbConfig = require('./config/db');
const path = require('path');

const { DateTime } = require('luxon');

const serverTime = DateTime.now();

// 서울의 시간대인 'Asia/Seoul'로 설정
const seoulTimeZone = 'Asia/Seoul';
//var seoulTime = DateTime.now().setZone(seoulTimeZone);
const seoulTime = serverTime.setZone(seoulTimeZone); 

//var currentTime =DateTime.now();
var currentTime = seoulTime.toISO();


console.log("top _ currentTime : " + currentTime);
var cur_total_time= String(currentTime.substring(5,10) + " " + currentTime.substring(11,19));
//var cur_date = String(currentTime.substring(6,7)+"/"+ currentTime.substring(8,10));
// 초까지 ) var cur_time = String(currentTime.substring(11,19)); 16
var cur_time = String(currentTime.substring(11,19));
//var cur_time = "10:00";

var month = currentTime.substring(5,7);  // MM
var day = currentTime.substring(8,10);  // dd

// Removing leading zero from the month if present
if (month.startsWith("0")) {
    month = month.substring(1);
}

// Removing leading zero from the day if present
if (day.startsWith("0")) {
    day = day.substring(1);
}

// Constructing the date in M/d format
var cur_date = String(month + "/" + day);


console.log("all: " + cur_total_time);
console.log("Date : " + cur_date);
console.log("time : " + cur_time);

var parsedTime = DateTime.fromISO(currentTime).setZone(seoulTimeZone);

// 기준 시간 설정 (서울 시간 기준)
var t_08 = DateTime.fromObject({ hour: 8, minute: 0, second: 0 }, { zone: seoulTimeZone });
var t_09 = DateTime.fromObject({ hour: 9, minute: 0, second: 0 }, { zone: seoulTimeZone });

const now = DateTime.now().setZone(seoulTimeZone);

var status;
var staticNum = "";
var studentName = "";
var classID ="";
var lessonID ="";



// 랜덤한 문자열 생성 함수
function generateRandomString(length) {
  return Math.random().toString(36).substr(2, length);
}

const secretKey = generateRandomString(32); // 32자리 랜덤 문자열 생성

// 세션 미들웨어 설정



const app = express();
const port = 3000;

//const connection = mysql.createConnection(dbConfig);
const pool = mysql.createPool(dbConfig);

app.use(bodyParser.json());

app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false
}));

// MySQL 연결
//connection.connect((err) => {
  pool.getConnection((err, connection) => {
  if (err) {
        console.error('MySQL 연결 실패:', err);
        return;
    }
    console.log('MySQL 연결 성공');


// http://localhost:3000/find

app.use(express.static(path.join(__dirname, 'public')));

// find.html을 제공하는 디렉토리 설정
app.use('/find', express.static(path.join(__dirname, 'find')));

// 기본 페이지 로드
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

app.get('/student', (req, res) => {
     staticNum = req.query.student_id;
     studentName = req.query.student_name;
    
    if (!staticNum || !studentName) { 
        res.status(400).json({ error: '고유번호와 이름을 입력해주세요. ~~~' });
        return;
    }


       // 트랜잭션 시작 =============÷========
       connection.beginTransaction(err => {
        if (err) {
            console.error('트랜잭션 시작 중 에러 발생:', err);
            res.status(500).json({ error: '트랜잭션을 시작하는 중 오류가 발생했습니다.' });
            return;
        }


    const sql = `SELECT DISTINCT s.school, s.grade, s.subject_name
        FROM att_stu_learn s
        WHERE s.student_id = ? AND s.student_name = ?`;

    connection.query(sql, [staticNum, studentName], (err, results) => {
        if (err) {
            console.error('학생 및 수강 정보 조회 중 에러 발생:', err);
             // 롤백
             connection.rollback(() => {

            console.log('학생 및 수강 정보 조회 중 에러 발생');
            res.status(500).json({ error: '학생 및 수강 정보를 조회하는 중 오류가 발생했습니다.' });
        });
        return;

        } else {
            if (results.length > 0) {
                // 결과 데이터를 학생 정보와 수강 정보로 구분하여 재구성
                const studentInfo = {
                    school: results[0].school,
                    grade: results[0].grade,
                    enrollments: []
                };
                
                // 수강 정보 추가
                results.forEach(row => {
                    studentInfo.enrollments.push({
                        subject: row.subject_name
                    });
                });
             // 커밋
             connection.commit(err => {
                if (err) {
                    console.error('트랜잭션 커밋 중 에러 발생:', err);
                    // 롤백
                    connection.rollback(() => {
                        res.status(500).json({ error: '트랜잭션을 커밋하는 중 오류가 발생했습니다.' });
                    });
                    return;
                }

                res.json(studentInfo);
            });
                console.log(studentInfo.enrollments);
            } else {
                 // 롤백
                 connection.rollback(() => {

               res.json({ valid: false, error: '학생 정보를 찾을 수 없습니다.' });   });

                //res.status(404).json({ error: '학생 정보를 찾을 수 없습니다.@@@@@' });
               // res.redirect(`/`);
            }
        }
    });
});
});
// Express 앱에서 /classes 라우트 정의
app.get('/classes', (req, res) => {
   // const { subject } = req.query;
    const subject = req.query.subject;
    const student_name = req.query.student_name;
    const stu_id = req.query.studentId;

    console.log("subject : "+ subject + " / student_name : " + student_name); 
    

    if (!subject) {
        res.status(400).json({ error: '과목을 선택해야 합니다.' });
        return;
    }

    connection.beginTransaction(err => {
        if (err) {
            console.error('트랜잭션 시작 중 에러 발생:', err);
            res.status(500).json({ error: '트랜잭션을 시작하는 중 오류가 발생했습니다.' });
            return;
        }

     //const sql = `SELECT class_name FROM att_class WHERE class_id IN ( SELECT class_id FROM att_map WHERE subject_id = (SELECT subject_id FROM att_subject WHERE subject_name = ?) AND student_id = (SELECT student_id FROM att_stu_learn WHERE student_name = ?))`;
     const sql = `SELECT class_name FROM att_stu_learn WHERE (student_name =? AND subject_name = ? AND student_id = ?)`;

      
    connection.query(sql, [student_name, subject, stu_id], (err, results) => {
        if (err) {
            console.error('반 목록 조회 중 에러 발생:', err);

            connection.rollback(() => {
            res.status(500).json({ error: '반 목록을 조회하는 중 오류가 발생했습니다.' });
        });
        return;

        } 
            const classes = results.map(row => row.class_name);
            console.log("classes : "+ classes);
            res.json(classes);
             // 커밋
             connection.commit(err => {
                if (err) {
                  console.error('트랜잭션 커밋 중 에러 발생:', err);
                  res.status(500).json({ error: '트랜잭션을 커밋하는 중 오류가 발생했습니다.' });
                }
                
                });
          
             });
        
    });
});


app.get('/lesson', (req, res) => {
     const class_name = req.query.class;
     const subject_name = req.query.subject;
     const stu_name = req.query.studentName;
     const stu_id = req.query.studentId;
     console.log("class_name : "+ class_name+"subject_name"+subject_name); 
     
 
     if (!class_name || !subject_name) {
         res.status(400).json({ error: '수업을 선택해야 합니다.' });
         return;
     }
     connection.beginTransaction(err => {
        if (err) {
          console.error('트랜잭션 시작 중 에러 발생:', err);
          res.status(500).json({ error: '트랜잭션을 시작하는 중 오류가 발생했습니다.' });
          return;
        }
    
 
       const sql = `SELECT * FROM att_lesson WHERE class_id = (SELECT class_id FROM att_class WHERE class_name = ? AND subject_id = (SELECT subject_id FROM att_subject WHERE subject_name= ?))`;
       

        connection.query(sql, [class_name, subject_name], (err, results) => {
            if (err) {
              console.error('수업 목록 조회 중 에러 발생:', err);
              // 롤백
              connection.rollback(() => {
                res.status(500).json({ error: '수업 목록을 조회하는 중 오류가 발생했습니다.' });
              });
              return;
            }
      
            // 결과 처리
            const lesson = results.map(row => row.lesson_name);
            console.log("lesson : " + lesson);
            res.json(lesson);
      
            // 커밋
            connection.commit(err => {
              if (err) {
                console.error('트랜잭션 커밋 중 에러 발생:', err);
                res.status(500).json({ error: '트랜잭션을 커밋하는 중 오류가 발생했습니다.' });
              }
            });
          });
        });
      });



 app.get('/save', (req, res) => {

  const userId = req.session.userId;
var cur_time2 = String(currentTime.substring(11,19));
    // const { subject } = req.query;
    const lesson_name = req.query.lesson;
     const class_name = req.query.class;
     const subject_name = req.query.subject;
	 const stu_name = req.query.studentName;
	const stu_id = req.query.studentId;
//     const { studentName, className, attend } = req.body;
 //    const student_name = req.query.student_name;
    console.log("========= 결과 저장 ==========")
    console.log("StudentID : " + stu_id + " / student name : " + stu_name);
     console.log("class_name : "+ class_name+" / subject_name : "+subject_name); 
    console.log("cur_time2 : "+ cur_time2);
 
     if (!class_name || !subject_name || !lesson_name) {
         res.status(400).json({ error: '반을 선택해야 합니다.' });
         return;
     }
	     connection.beginTransaction(err => {
        if (err) {
            console.error('트랜잭션 시작 중 에러 발생:', err);
            res.status(500).json({ error: '트랜잭션을 시작하는 중 오류가 발생했습니다.' });
            return;
        }


       const classIdSql = `SELECT class_id FROM att_class WHERE class_name = ? AND subject_id = (SELECT subject_id FROM att_subject WHERE subject_name= ?)`;
      
       connection.query(classIdSql, [class_name, subject_name], (err, classIdResults) => {
        if (err) {
            console.error('class ID 조회 중 에러 발생:', err);
            connection.rollback(() => {
                    console.error('트랜잭션 롤백 완료');
                    res.status(500).json({ error: '트랜잭션을 롤백하는 중 오류가 발생했습니다.' });
                });
                return;
            }


        if (classIdResults.length === 0) {
            res.status(404).json({ error: 'class ID을 찾을 수 없습니다.' });
            return;
        }

          classID = classIdResults[0].class_id;
          console.log("classID : "+ classID );
    
        const lessonIdSql = `SELECT lesson_id FROM att_lesson WHERE lesson_name = ? AND class_id = ?`;
      
       connection.query(lessonIdSql, [lesson_name, classID], (err, lessonIdResults) => {
        if (err) {
            console.error('lesson ID 조회 중 에러 발생:', err);
                       connection.rollback(() => {
                    console.error('트랜잭션 롤백 완료');
                    res.status(500).json({ error: '트랜잭션을 롤백하는 중 오류가 발생했습니다.' });
                });
                return;
            }


        if (lessonIdResults.length === 0) {
            res.status(404).json({ error: 'lesson ID을 찾을 수 없습니다.' });
            return;
        }

          lessonID = lessonIdResults[0].lesson_id;
          console.log("lessonID : "+ lessonID );
    
          const realNameSql = `SELECT realName FROM att_stu_learn WHERE student_name = ? AND student_id = ?`;
      
          connection.query(realNameSql, [stu_name, stu_id], (err, realNameSqlResults) => {
           if (err) {
               console.error('lesson ID 조회 중 에러 발생:', err);
                            connection.rollback(() => {
                    console.error('트랜잭션 롤백 완료');
                    res.status(500).json({ error: '트랜잭션을 롤백하는 중 오류가 발생했습니다.' });
                });
                return;
            }

   
           if (realNameSqlResults.length === 0) {
               res.status(404).json({ error: '이름을 찾을 수 없습니다.' });
               return;
           }
   
             realName = realNameSqlResults[0].realName;
             console.log("lessonID : "+ realName );
    
          const selectTime = `SELECT time_start, time_end FROM att_lesson WHERE lesson_id = ?`;
      
          connection.query(selectTime, [lessonID], (err, selectTimeResults) => {
           if (err) {
               console.error('selectTime 조회 중 에러 발생:', err);
                             connection.rollback(() => {
                    console.error('트랜잭션 롤백 완료');
                    res.status(500).json({ error: '트랜잭션을 롤백하는 중 오류가 발생했습니다.' });
                });
                return;
            }

   
           if (selectTimeResults.length === 0) {
               res.status(404).json({ error: 'selectTime을 찾을 수 없습니다.' });
               return;
           }
           const times = selectTimeResults.map(row => ({ time_start: row.time_start, time_end: row.time_end }));
           console.log("times : ", times);
           console.log(times[0].time_start, " / ", times[0].time_end);

            var dbStartTimeString = times[0].time_start; // 시작 시간
            var dbEndTimeString = times[0].time_end; // 종료 시간
//
         //   timecheck();
           //res.json(times);
         //  console.log("att_status : "+ att_status );
        
// 시간 문자열을 DateTime 객체로 변환
const startTime = DateTime.fromFormat(dbStartTimeString, 'HH:mm', { zone: seoulTimeZone });
const endTime = DateTime.fromFormat(dbEndTimeString, 'HH:mm', { zone: seoulTimeZone });

// 시간 범위 설정
const attendanceStart = startTime.minus({ minutes: 30 }); // 시작 시간 - 30분
const attendanceEnd = startTime.plus({ minutes: 10 }); // 시작 시간 + 10분
const tardinessEnd = endTime; // 종료 시간

// 현재 시간과 비교


if (now >= attendanceStart && now <= attendanceEnd) {
  status = "O"; // 시작 시간의 -30분 ~ +10분 사이
} else if (now > attendanceEnd && now <= tardinessEnd) {
  status = "▲"; // 시작 시간의 +10분 ~ 종료 시간 사이
} else if (now > tardinessEnd) {
  status = "X"; // 종료 시간 이후
} else {
  status = "외"; // 그 외 시간
}

console.log(status);


//const alterquery = `ALTER TABLE att_record ADD CONSTRAINT unique_record_student_lesson_2 UNIQUE (attend_date, student_id, lesson_id)`;
const insertRecordQuery = `INSERT IGNORE INTO att_record (attend_date, student_id, realName, student_name, subject_name, class_id, class_name, lesson_id, lesson_name, attend_status, attend_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
const values = [cur_date, stu_id, realName, stu_name, subject_name, classID, class_name, lessonID, lesson_name, status, cur_time2];

//connection.query(alterquery, function (error, results, fields) {
// if (error) throw error;


connection.query(insertRecordQuery,values, (err, result) => {
if (err) {
  console.error('데이터 삽입 중 에러 발생:', err);
                 connection.rollback(() => {
                    console.error('트랜잭션 롤백 완료');
                    res.status(500).json({ error: '트랜잭션을 롤백하는 중 오류가 발생했습니다.' });
                });
                return;
            }
  connection.commit(err => {
                        if (err) {
                            console.error('트랜잭션 커밋 중 에러 발생:', err);
                            // 롤백
                            connection.rollback(() => {
                                console.error('트랜잭션 롤백 완료');
                                res.status(500).json({ error: '트랜잭션을 롤백하는 중 오류가 발생했습니다.' });
                            });
                        } else {
                            console.log('트랜잭션 커밋 완료');
                            // 성공적으로 모든 작업을 수행한 경우 응답
                            res.json({ success: true });
                        }

                      });
                    
                });
            });
        });
      });
    });
});

 });
    


// == find ==


    // A 드롭다운 값을 가져오는 API
app.get('/api/a', (req, res) => {
  const userId = req.session.userId;
    const drop1_sub = `SELECT distinct subject_name FROM att_subject      
    INNER JOIN att_class ON att_subject.subject_id = att_class.subject_id
    WHERE att_subject.subject_id IN (
        SELECT distinct att_class.subject_id FROM att_class  
        INNER JOIN att_lesson ON att_class.class_id = att_lesson.class_id
        
        WHERE att_class.class_id IN (
            SELECT class_id 
             FROM att_lesson
            WHERE STR_TO_DATE(time_start, '%H:%i') -1800 <= STR_TO_DATE('${cur_time}', '%H:%i') 
              AND STR_TO_DATE(time_end, '%H:%i') >= STR_TO_DATE('${cur_time}', '%H:%i')AND locate IS NOT NULL ) )`;
    connection.query(drop1_sub, (error, results) => {
      if (error) throw error;
      //res.json(results);
    //console.log("query1 : " + results[1]);
    const find_sub = results.map(row => row.subject_name);
    console.log("find_sub : "+ find_sub);
    res.json(find_sub);

    });
  });
  
  // B 드롭다운 값을 가져오는 API
  app.get('/api/b/:subjectName', (req, res) => {
    const userId = req.session.userId;
    const subjectName = req.params.subjectName;
    const drop2_cl = `SELECT distinct class_name FROM att_class  
    INNER JOIN att_lesson ON att_class.class_id = att_lesson.class_id
    WHERE att_class.class_id IN (
        SELECT class_id 
         FROM att_lesson
         WHERE STR_TO_DATE(time_start, '%H:%i') - INTERVAL 1800 SECOND <= STR_TO_DATE('${cur_time}', '%H:%i') 
        AND STR_TO_DATE(time_end, '%H:%i') >= STR_TO_DATE('${cur_time}', '%H:%i')
    
          AND locate IS NOT NULL
    ) 
    AND att_class.subject_id = (
    SELECT subject_id
    FROM att_subject
    WHERE subject_name = ?)`;
    //
    connection.query(drop2_cl,[subjectName],  (error, results) => {
      if (error) throw error;
      const find_class = results.map(row => row.class_name);
      console.log("find_class : "+ find_class);
      res.json(find_class);
        //res.json(results);
    });
  });
  
  // C 드롭다운 값을 가져오는 API
  app.get('/api/c/:subjectName/:className', (req, res) => {
    const userId = req.session.userId;
    const subjectName = req.params.subjectName;
    const className = req.params.className;
    const drop3_les = `SELECT att_lesson.lesson_name as LN FROM att_subject
    INNER JOIN att_class ON att_subject.subject_id = att_class.subject_id
    INNER JOIN att_lesson ON att_class.class_id = att_lesson.class_id
    
    WHERE att_subject.subject_name = ?
    AND att_class.class_name = ?
    AND TIME_TO_SEC(TIME(att_lesson.time_start)) - 1800 <= TIME_TO_SEC(TIME('${cur_time}')) 
    AND TIME(att_lesson.time_end) >= TIME('${cur_time}')` ;
    connection.query(drop3_les, [subjectName, className], (error, results) => {
      if (error) throw error;
      const find_lesson = results.map(row => row.LN);
      console.log("find_lesson : "+ find_lesson);
      res.json(find_lesson);
    });
  });

  
  //app.get('/locate', (req, res) => {
    app.get('/api/d/:subjectName/:className/:lessonName', (req, res) => {
    // const { subject } = req.query;
    const userId = req.session.userId;
    const lessonName = req.params.lessonName;
    const className = req.params.className;
    const subjectName = req.params.subjectName;
     console.log("subjectName : "+ subjectName + " / className : " + className + "/ lessonName : " + lessonName); 
     
 
     if (!subjectName || !className|| !lessonName) {
         res.status(400).json({ error: '값 : null' });
         return;
     }
 
      //const sql = `SELECT class_name FROM att_class WHERE class_id IN ( SELECT class_id FROM att_map WHERE subject_id = (SELECT subject_id FROM att_subject WHERE subject_name = ?) AND student_id = (SELECT student_id FROM att_stu_learn WHERE student_name = ?))`;
      const sql = `SELECT s.locate as loc
                    FROM att_lesson s
                    JOIN att_class b ON s.class_id = b.class_id
                    JOIN att_subject m ON b.subject_id = m.subject_id
                    WHERE m.subject_name = ?
                    AND b.class_name = ?
                    AND s.lesson_name = ?`;
 
       
     connection.query(sql, [subjectName, className, lessonName], (err, results) => {
         if (err) {
             console.error('장소 조회 중 에러 발생:', err);
             res.status(500).json({ error: '장소 조회하는 중 오류가 발생했습니다.' });
         } else {
             const location = results.map(row => row.loc);
             console.log("location : "+ location);
             res.json(location);
         }
     });
 });
 
});


// 정적 파일 서빙 (index.html, script.js)
app.use(express.static('public'));

// 서버 시작
app.listen(port, () => {
    console.log(`서버 실행 중: http://localhost:${port}`);
});

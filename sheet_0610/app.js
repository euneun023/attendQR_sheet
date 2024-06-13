const mysql = require('mysql');

const { google } = require('googleapis');
//const creds = require('./credentials.json'); // 구글 API 인증 정보 파일 경로
//const sheets = google.sheets({ version: 'v4', auth: creds });

//const { google } = require('googleapis');

const { JWT } = require('google-auth-library'); 

const creds = require('./123.json'); 

const auth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const cron = require('node-cron'); // 추가 설치 필요 
cron.schedule('*/5 * * * *', func11);

const connectionName = '34.64.190.242'; 
//const connectionName = 'localhost'; 
const user = 'root';
const userPwd = '1234'; 
const db = 'attdb';
const instanceUrl = 'jdbc:mysql://' + connectionName;
const dbUrl = instanceUrl + '/' + db;


const conn = mysql.createConnection({
  host: connectionName,
  user: user,
  password: userPwd,
  database: db
});




async function func11() {


  var dbDataArray = [];
  var RnameArray = [];
  var lessonArray = [];
  var statusArray = [];
  var subjectNameArray = [];
  var classNameArray = [];
  var idArray = [];
  var maxId;
  
 
  
  await conn.connect();

  var todayDate = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  const query = "SELECT record_id, realName, subject_name, class_name, lesson_name, attend_status FROM att_record WHERE attend_date = ?";
  const results = await new Promise((resolve, reject) => {
    conn.query(query, [todayDate], (error, results) => {
      if (error) reject(error);
         resolve(results);
    });
  });

  results.forEach(row => {
    const dbRow = []; 
    dbRow.push(row.record_id); 
    dbRow.push(row.realName); 
    dbRow.push(row.lesson_name); 
    dbRow.push(row.attend_status); 
    dbRow.push(row.subject_name);
    dbRow.push(row.class_name);

    idArray.push(row.record_id);
    dbDataArray.push(dbRow);
    RnameArray.push(row.realName);
    lessonArray.push(row.lesson_name);
    statusArray.push(row.attend_status);
    subjectNameArray.push(row.subject_name);
    classNameArray.push(row.class_name);
  });

  if(idArray.length == 0){
    console.log("record_id 값이 존재하지 않습니다.");
  } else {
  console.log("idArray : "+ idArray);
  maxId = Math.max(...idArray);
 console.log("maxId :" + maxId); 
}

  const subjectSet = new Set(subjectNameArray);  
  const uniqueSubjectArray = [...subjectSet];

  for (let uniCnt = uniqueSubjectArray.length - 1; uniCnt >= 0; uniCnt--) {
    let sheetId;
    if (uniqueSubjectArray[uniCnt] == 'SAT') {
      sheetId = '16_qske8ijFtheGk-VDWjOpQJsy2ybP8_v3wvFmCDo48';
    } else if (uniqueSubjectArray[uniCnt] == 'TOEFL') {
      sheetId = '1flthid78xhKgk-NpgQ5Zmk5WLfo9Wa8xvbrqe3VJkEo';
    } else if (uniqueSubjectArray[uniCnt] == 'MATH') {
      sheetId = '1GTlkgNP4yVli89Cr6Sk_Gm_u74PKBUc2Z5044pSqlP0';
    } else if (uniqueSubjectArray[uniCnt] == 'AP') {
      sheetId = '1Jc503QpDNCHvkjLRSh0SuooiGu_f9YxZPktxoXfr8CA';
    } else if (uniqueSubjectArray[uniCnt] == 'bELLA Math') {
      sheetId = '1I0HMFBMw5O8exj3bxqli7LE4HUYm6gGQNSMeL_7_Y1U';
    } else if (uniqueSubjectArray[uniCnt] == '선행수업') {
      sheetId = '18H753Kp6vckv27nQ8VGd8exeUBa3bktMebzrGGtYwSk';
    }
    else if (uniqueSubjectArray[uniCnt] == 'Middle The Nobel Program') {
      sheetId = '1lyCkCOVqqns9AVYw18bd-eh2Q0OWPe7QqqW421DvPdU';
    } else if (uniqueSubjectArray[uniCnt] == 'The Pulitzer Program') {
      sheetId = '1hlqYjRLe2Zmfy_yoAbt5mKB8QoKp2EgMZY8rtTPyQfw';
    } else if (uniqueSubjectArray[uniCnt] == 'Junior The Nobel Program') {
      sheetId = '1bcUBGzZ-p_GTXtV8igxdV1T-mW1pt_3k6ZYujNG23dI';
    }
    
    var cellValue ='';
   
    const filteredClassNameArray = classNameArray.filter((_, i) => subjectNameArray[i] === uniqueSubjectArray[uniCnt]);
    const u_ClassNameArray = [...new Set(filteredClassNameArray)];
  

    for (let cnt = u_ClassNameArray.length - 1; cnt >= 0; cnt--) {
      const sheetName = u_ClassNameArray[cnt];
      const response = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        ranges: [`${sheetName}!A1:Z1000`],
        includeGridData: true
      });
      const sheetData = response.data.sheets[0].data[0].rowData;
      if (!sheetData) {
        console.log("시트없음")
        continue;
      }
      console.log(sheetId);
      const todayDateIndex = sheetData[1].values.findIndex(value => value.formattedValue === todayDate);
      if (todayDateIndex === -1) continue;
  console.log("todayDateIndex : "+ todayDateIndex);
      for (let lessonRow = 0; lessonRow < 3; lessonRow++) {
        const statuscell = todayDateIndex + lessonRow ; // 5 6 7 

        console.log("statuscell : " + statuscell);
        if(sheetData[3].values[statuscell].formattedValue != undefined ){
        var lessonValue = sheetData[3].values[statuscell].formattedValue; //
        if(lessonValue ==="R"){
          lessonValue = "Reading"
        }
        else if(lessonValue ==="W"){
          lessonValue = "Writing";
        }else if (lessonValue ==="S"){
          lessonValue = "Skill mastery";
        }else if(lessonValue ==="C"){
          lessonValue = "Clinic";
        }
        const matchingDbLesson = dbDataArray.filter(dbLesson => dbLesson[4] === sheetName && dbLesson[1] === lessonValue);

        console.log("matchingDbLesson : "+ matchingDbLesson);
//        console.log("matchingDbLesson1 : "+ matchingDbLesson[0][0]);
        console.log("lessonValue : "+ lessonValue);
        if (matchingDbLesson) {
          //이름비교
          console.log("sheetData.length : "+ sheetData.length);
          for (let i = 4; i < sheetData.length; i++) {
          if(sheetData[i].values[0].formattedValue != undefined){ //
          
            
            

            for (let k=0; k< matchingDbLesson.length; k++) { //const matchingDbName of matchingDbLesson
              if (sheetData[i].values[0].formattedValue === matchingDbLesson[k][0]) {
                var matchingDbName = sheetData[i].values[0].formattedValue;
                 console.log("cellValue : " + sheetData[i].values[0].formattedValue);
                console.log("matchingDbName : "+ matchingDbName);
                const matchingAttendStatus = matchingDbLesson.find(status => status[0] === matchingDbName); //[0]

                console.log("matchingAttendStatus : " + matchingAttendStatus[2]);
                var status = matchingAttendStatus[2];
               var column ='';
              // statuscell = parseInt(statuscell) - 1;
               if ( statuscell >= 1 && statuscell <= 702) {
                let firstDigit = Math.floor((statuscell) / 26) + 65; // 첫 번째 자리 알파벳
                let secondDigit = ((statuscell) % 26) + 65; // 두 번째 자리 알파벳
                
               
                if (firstDigit === 65) {
                  column = String.fromCharCode(secondDigit);
                } else {
                  column  = String.fromCharCode(firstDigit) + String.fromCharCode(secondDigit);
                }
            }

                var row= i+1;
              console.log(sheetName + "/  c : "+ column + " / r : " + row);
                const response = await sheets.spreadsheets.values.update({
                  spreadsheetId: sheetId,
                  range: `${sheetName}!${column}${row}`,
                  valueInputOption: 'USER_ENTERED',
                  requestBody: {
                    values: [
                      [status]
                  ]   
                  }
                });
                //sheetData[i].values[statuscell] = matchingAttendStatus[2];
                break;
              }
            }
            }
          }
        }
      }
      }
    }
  }
 // conn.end();
  return maxId;
}




async function func22() {
  const result = await func11(); 
  console.log(result); 
  conn.beginTransaction(function(err) {
    if (err) { 
      reject(err);
      return;
    }
    
    const deleteQuery = "DELETE FROM att_record where record_id <= ?;";
    conn.query(deleteQuery, [result], function (error, results) {
      if (error) {
        // 롤백
        conn.rollback(function() {
          reject(error);
        });
        return;
      }
  
      // 트랜잭션 커밋
      conn.commit(function(err) {
        if (err) { 
          // 롤백
          conn.rollback(function() {
            reject(err);
          });
          return;
        }
        
        // 커밋 완료
        console.log('삭제 작업이 성공적으로 완료되었습니다.');
        conn.end();
      });
    });
  });
}

func22(); 

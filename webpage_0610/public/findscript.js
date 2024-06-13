
//document.getElementById('btn2').disabled = true;
var subjectName = '';
var className = '';
var lessonName = '';
var classSelect = '';
var lessonSelect = '';
//subjectSelectElement.innerHTML = '<option hidden="" disabled="disabled" selected="selected" value="">과목 선택</option>'; //과목 선택
 document.addEventListener('DOMContentLoaded', () => {
      fetch('/api/a')
        .then(response => response.json())
        .then(find_sub => {
          const subjectSelect = document.getElementById('subjectSelect');
          find_sub.forEach(item => {
            const option = document.createElement('option');
           // option.value = item.id;
         //   option.text = item.name;  // Assuming 'name' is a column in your table
              option.value = item;
              option.textContent = item;
              subjectSelect.appendChild(option);
         
        // subjectSelect.add(option);
          });
        });

    
      document.getElementById('subjectSelect').addEventListener('change', function() {
         subjectName = document.getElementById('subjectSelect').value; //this.value;
        
        console.log("subjectName : " + subjectName );
         classSelect = document.getElementById('classSelect');
        classSelect.innerHTML = '<option hidden="" value="">반 선택</option>';
        classSelect.disabled = !subjectName;

        if (subjectName) {
          fetch(`/api/b/${subjectName}`)
            .then(response => response.json())
            .then(find_class => {
              find_class.forEach(item2 => {
                const option = document.createElement('option');
                option.value = item2;
                option.textContent = item2;
                classSelect.appendChild(option);
                // bDropdown.append(`<option value="${item.id}">${item.name}</option>`);
                
              });
            });
        }
      });


    
      document.getElementById('classSelect').addEventListener('change', function() {
         subjectName = document.getElementById('subjectSelect').value;
         className = document.getElementById('classSelect').value; //this.value;
         lessonSelect = document.getElementById('lessonSelect');
        
        lessonSelect.innerHTML = '<option hidden="" value="">수업 선택</option>';
        lessonSelect.disabled = !className;

        if (className) {
          fetch(`/api/c/${subjectName}/${className}`)
            .then(response => response.json())
            .then(find_lesson => {
              find_lesson.forEach(item3 => {
                const option = document.createElement('option');
                option.value = item3;
                option.textContent = item3;
                lessonSelect.appendChild(option);
                //lessonSelect.add(option);
              });
            });
        }
      });
    });

    subjectSelect.addEventListener('change', function() {
      classSelect.selectedIndex = 0; // 반 선택 초기화
      lessonSelect.selectedIndex = 0; // 다른 선택 초기화
      checkDropdownValues(); // 버튼 상태 다시 확인
  });


var locateStr = '';
var imgurl ='';
  function find_in2() {
    //selectedlesson= lessonSelectElement.value;
    lessonName = document.getElementById('lessonSelect').value;
    console.log("subject NAme : " + subjectName + " / classNAme : "+ className + " / lessonNAme : "+ lessonName);
      if (lessonName) {
         
      
   //   fetch(`/locate?lesson=${encodeURIComponent(lessonName)}&class=${encodeURIComponent(className)}&subject=${encodeURIComponent(subjectName)}`)    
   const encodedLessonName = encodeURIComponent(lessonName);
   fetch(`/api/d/${subjectName}/${className}/${encodedLessonName}`)
          .then(response => response.json())

          .then(location => {
            if (Array.isArray(location)) { // location이 배열인지 확인
              // location이 배열이라면, 첫 번째 값을 사용
              locateStr = location[0];
            } else {
              locateStr = location; // location이 배열이 아니면 그대로 사용
            }
    
            const messageElement = document.getElementById('message');
            if (messageElement) {
              messageElement.textContent = locateStr || '';
              console.log("locate text : " + locateStr);
              if(locateStr =="library-1"||locateStr =="library-2"||locateStr =="library-3"){
                imgurl = 'img/001.png';
              }else if(locateStr =="Harvard-1"||locateStr =="Harvard-2"||locateStr =="Harvard-3"||locateStr =="Harvard-4"||locateStr =="Harvard-5"){
                imgurl = 'img/002.png';
              }else if(locateStr =="Yale-1"||locateStr =="Yale-2"||locateStr =="Yale-3"||locateStr =="Yale-4"){
                imgurl = 'img/003.png';
              }else if(locateStr =="Princeton-1"||locateStr =="Princeton-2"){
                imgurl = 'img/004.png';
              }else if(locateStr =="Stanford"){
                imgurl = 'img/005.png';
              }
              find_in1();
            } else {
              if(locateStr =="library-1"||locateStr =="library-2"||locateStr =="library-3"){
                imgurl = 'img/001.png';
              }else if(locateStr =="Harvard-1"||locateStr =="Harvard-2"||locateStr =="Harvard-3"||locateStr =="Harvard-4"||locateStr =="Harvard-5"){
                imgurl = 'img/002.png';
              }else if(locateStr =="Yale-1"||locateStr =="Yale-2"||locateStr =="Yale-3"||locateStr =="Yale-4"){
                imgurl = 'img/003.png';
              }else if(locateStr =="Princeton-1"||locateStr =="Princeton-2"){
                imgurl = 'img/004.png';
              }else if(locateStr =="Stanford"){
                imgurl = 'img/005.png';
              }
             
              find_in1();
            }
          })
            
          .catch(error => {
              console.error('저장 중 에러:', error);
          });     
  }
  
}

classSelect.addEventListener('change', checkDropdownValues);
lessonSelect.addEventListener('change', checkDropdownValues);

function checkDropdownValues(){
//      if (subjectSelect.value && classSelect.value && lessonSelect.value) {
      if (subjectName && className && lessonName) {
          btn2.disabled = true;
      } else {
          btn2.disabled = false;
      }
}
      function find_in1(){
        text_ = subjectSelect.value + " - " + classSelect.value  + " (" + lessonSelect.value+")";
        Swal.fire({
            confirmButtonColor:'#808080',
            title: "강의실 : " +locateStr, //'3층 306강의실',
            text: text_,
           // text: 'Modal with a custom image.',
          
          imageUrl: imgurl,
        imageWidth: 400,
         imageHeight: 200,
       //  imageAlt: 'Custom image',
    
          confirmButtonText: '확인', // 확인 버튼 텍스트 수정
       //   cancelButtonText: '다시 선택', 
        //  showCancelButton: true, // 확인 버튼과 취소 버튼 모두 표시
        // text: 'Modal with a custom image.',
            }).then((result) => {
              if (result.isConfirmed) { // 확인 버튼이 클릭되면
                  location.reload(); // 페이지 새로 고침
              }
          });
    }

    
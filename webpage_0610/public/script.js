
   const subjectSelectElement = document.getElementById('subjectSelect');
   const classSelectElement = document.getElementById('classSelect');
   const lessonSelectElement = document.getElementById('lessonSelect');
   var schoolInput ="";
   var gradeInput = "";
    const btn2 = document.getElementById('btn2');
    document.getElementById('btn2').disabled = true;

    const input = document.getElementById('staticNumInput');
    const input2 = document.getElementById('nameInput');
    
   var toggleButton = document.getElementById('toggleButton');


    function checkDropdownValues() {
        console.log('Subject:', subjectSelectElement.value);
        console.log('Class:', classSelectElement.value);
        console.log('Another:', lessonSelectElement.value);

        if (subjectSelectElement.value && classSelectElement.value && lessonSelectElement.value) {
            btn2.disabled = false;
        } else {
            btn2.disabled = true;
        }
    }


    function begin_in(){
    //조건
    if (subjectSelectElement.value && classSelectElement.value && lessonSelectElement.value && schoolInput.value && gradeInput.value){

        Swal.fire({icon: 'success', title:'출석되었습니다.'}).then(function(){
            location.reload();
        })
        fetchResult();
    }
    else {
        Swal.fire({icon: 'warning', title:'올바르게 입력했는지 확인해주세요.'}).then(function(){  
        })
    }
}

function find_in(){
    text_ = subjectSelectElement.value + " / " + classSelectElement.value  + " (" + lessonSelectElement.value+")";
    Swal.fire({
        confirmButtonColor:'#808080',
        title: '3층 306강의실',
        text: text_,
       // text: 'Modal with a custom image.',
    /*  
      imageUrl: 'https://unsplash.it/400/200',
    imageWidth: 400,
     imageHeight: 200,
     imageAlt: 'Custom image',
*/
    })  
 //   location.reload(); //할지 말지
}


function checkInput() {
     const input = document.getElementById('staticNumInput');
     const input2 = document.getElementById('nameInput');
    if (input.value != '' && input2.value != '' ) {
        toggleButton.disabled = false;
    } else {
        toggleButton.disabled = true;
    }
}


function fetchStudentInfo() {
    const staticNum = document.getElementById('staticNumInput').value.trim();
    const name = document.getElementById('nameInput').value.trim();   

    toggleButton = document.getElementById('toggleButton');
    const myDiv = document.getElementById('my-div');
    const toggleButton2 = document.getElementById('btn2');
    
    console.log("조회 1 / toggleButton 값 : " + toggleButton.textContent);

    const name_num_div = document.getElementById('name_num_div');
    const school_div = document.getElementById('school_div');
    const grade_div = document.getElementById('grade_div');

    if(toggleButton.textContent=="확인"){
        input.classList.add('hidden');
        name_num_div.classList.add('hidden');
        school_div.classList.add('hidden');
        grade_div.classList.add('hidden');
    }


    // 버튼 클릭 시 토글 및 처리 로직 실행
    const handleButtonClick = () => {
        toggleButton.classList.add('hidden');
        myDiv.classList.remove('hidden');
        toggleButton2.style.display = 'block';

        // 이후 원하는 로직 실행
        console.log('토글 및 처리 로직 실행');
    };

    // 이벤트 리스너 등록
    toggleButton.addEventListener('click', handleButtonClick);

    // 버튼 클릭 이벤트 발생 (동시에 실행)
  
    //없어도 될듯? 
    if (!staticNum || !name) {
        alert('고유번호와 이름을 입력해주세요.');
        if(!staticNum && name){
            alert('고유번호를 입력해주세요.');
        }else if(staticNum && !name){
            alert('이름을 입력해주세요.');
        }
     console.log("staticNum : "+ staticNum + "name : " + name);
        location.reload();
    }
    // ======여기까지======//


    
    handleButtonClick();
    fetch(`/student?student_id=${encodeURIComponent(staticNum)}&student_name=${encodeURIComponent(name)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('서버 응답 오류');
            }
            return response.json();
        })
        .then(data => {
        //    const errorMessageElement = document.getElementById('errorMessage');
       //     errorMessageElement.textContent = ''; // 이전 오류 메시지 초기화

            if (data.error) {
         //       errorMessageElement.textContent = data.error;
                alert(data.error);
                location.reload();
            }
            
            // 학교와 학년 설정
              schoolInput = document.getElementById('schoolInput');
              gradeInput = document.getElementById('gradeInput');

            

            schoolInput.value = data.school || '학교 정보 없음';
            gradeInput.value = data.grade ? `${data.grade}학년` : '학년 정보 없음';

            // 과목과 반 목록 설정

            subjectSelectElement.innerHTML = '<option hidden="" disabled="disabled" selected="selected" value="">과목 선택</option>'; //과목 선택
           

            data.enrollments.forEach(enrollment => {
                const subjectOption = document.createElement('option');
                subjectOption.value = enrollment.subject; // 과목의 ID 값을 value로 설정
                subjectOption.textContent = enrollment.subject;
                console.log("enrollment.subject : "+ enrollment.subject);
                subjectSelectElement.appendChild(subjectOption);

            });
            subjectSelect.addEventListener('change', function() {
                classSelectElement.selectedIndex = 0; // 반 선택 초기화
                lessonSelectElement.selectedIndex = 0; // 다른 선택 초기화
                checkDropdownValues(); // 버튼 상태 다시 확인
            });
        })

        
        .catch(error => {
           // console.error('학생 정보 조회 중 에러:', error);
            //const errorMessageElement = document.getElementById('errorMessage');
           // errorMessageElement.textContent = '학생 정보를 조회하는 중 오류가 발생했습니다.';
          // alert('학생 정보 조회하는 중 오류가 발생했습니다. 페이지를 새로고침합니다.');
         //  location.reload();
        });
}


function fetchClassesBySubject() {
    selectedSubject = document.getElementById('subjectSelect').value;

    console.log("selectedSubject 1 : " + selectedSubject);


    student_name = document.getElementById('nameInput').value;
    var stu_id = document.getElementById('staticNumInput').value;
    

    if (!selectedSubject) {
        return;
    }
    fetch(`/classes?subject=${encodeURIComponent(selectedSubject)}&student_name=${encodeURIComponent(student_name)}&studentId=${encodeURIComponent(stu_id)}`)    
        .then(response => {
            if (!response.ok) {
                throw new Error('서버 응답 오류');
            }
            return response.json();
        })
        .then(classes => {
            const classSelectElement = document.getElementById('classSelect');
            classSelectElement.innerHTML = '<option hidden="" disabled="disabled" selected="selected" value="">반 선택</option>';
            classes.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                classSelectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('반 목록 조회 중 에러:', error);
        });
}



function fetchClassesBySubject2() {
    selectedclass = document.getElementById('classSelect').value;
    var stu_name = document.getElementById('nameInput').value;
    var stu_id = document.getElementById('staticNumInput').value;

    console.log("selectedclass : " + selectedclass);

    if (!selectedclass) {
        return;
    }
    fetch(`/lesson?class=${encodeURIComponent(selectedclass)}&subject=${encodeURIComponent(selectedSubject)}&studentName=${encodeURIComponent(stu_name)}&studentId=${encodeURIComponent(stu_id)}`)    
        .then(response => {
            if (!response.ok) {
                throw new Error('서버 응답 오류');
            }
            return response.json();
        })
        .then(lesson => {
          
            lessonSelectElement.innerHTML = '<option hidden="" disabled="disabled" selected="selected" value="">수업 선택</option>';

            lesson.forEach(lessonName => {
                const option = document.createElement('option');
                option.value = lessonName;
                option.textContent = lessonName;
                lessonSelectElement.appendChild(option);
            });
            

    classSelectElement.addEventListener('change', checkDropdownValues);
    lessonSelectElement.addEventListener('change', checkDropdownValues);
        })
        .catch(error => {
            console.error('수업 목록 조회 중 에러:', error);
        });
}


function fetchResult() {
  selectedlesson= lessonSelectElement.value;
var	stu_name = document.getElementById('nameInput').value
var    stu_id = document.getElementById('staticNumInput').value
    if (!selectedSubject) {
        return;
    }
    fetch(`/save?lesson=${encodeURIComponent(selectedlesson)}&class=${encodeURIComponent(selectedclass)}&subject=${encodeURIComponent(selectedSubject)}&studentName=${encodeURIComponent(stu_name)}&studentId=${encodeURIComponent(stu_id)}`)    
 
        .then(response => response.json())
        .then(data => {
            document.getElementById('message').textContent = data.message || data.error;
        })
        .catch(error => {
            console.error('저장 중 에러:', error);
        });
}

//강의실 찾기
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname === '/find.html') {
        loadDropdownData();
    }
});

async function loadDropdownData() {
    const dropdown = document.getElementById('subjectSelect');

    try {
        const response = await fetch('/api/data');
        const data = await response.json();

        dropdown.innerHTML = `<option value="${data.dataField}">${data.dataField}</option>`;
    } catch (error) {
        dropdown.innerHTML = `<option>Error loading data</option>`;
    }
}

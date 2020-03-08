var start = new Date;
var globalTimer = new Object;


$(document).ready(function () {

    getLockers();

    //call scan qr code screen
    $(document).on('click', 'button[name="button-slot"]', function () {
        var lockerId = $(this).attr('data-lockerid');
        var lockerNo = $(this).attr('data-lockerno');
        localStorage.setItem('slotNumber', lockerId);
        localStorage.setItem('slotLockerNo', lockerNo);

        $('#txtScanQRCode').val('');
        $('#lblUserName').text('');
        $('#scanQRError').hide();

        $('#txtScanQRCode').focus();
        $('#scanQRCodeModalTitle').text('Slot ' + lockerId + ' - Scan QR Code');
        $('#scanQRCode').modal('show');
        $('#btnOpenRegister').attr('data-slot', lockerId);
    });

    //call register user screen
    $('#btnOpenRegister').on('click', function () {
        var userName = $('#lblUserName').text();
        if (userName.length > 0)
        {
            //$('#scanQRCode').modal('hide');
            var studentId = $('#txtScanQRCode').val();
            var lockerId = $('#btnOpenRegister').attr('data-slot');

            getLockerSubscriptionDetails(lockerId, studentId);            
               
        }
        else
        {            
            $('#scanQRError').removeClass('alert alert-danger');
            $('#scanQRError').addClass('alert alert-warning');
            $('#scanQRError').text('Scan student ID QR Code to continue.');
            $('#scanQRError').show();
        }
           
    });

    //Scan QR Code
    $(document).on('input','#txtScanQRCode', function () 
    {        
        var lockerId = $('#btnOpenRegister').attr('data-slot');
        if ($(this).val().length >= 6)
        {
            getScannedUserDetails($(this).val(), lockerId)
        }
    });

    //save user
    $('#btnRegister').on('click', function () {
        registerUser();
    });

    //opens confirmation screen
    $('#btnCallConfirmation').on('click', function () {
        var studentId = $('#btnCallConfirmation').attr('data-id');

        getUserData(studentId);
    });

    //displays user name, coin/bill inserted and time 
    $('#btnConfirmTransaction').on('click', function () {
        var studentId = $(this).attr('data-userid');
        var lockerId = $(this).attr('data-lockerid');

        saveUserSubscription(studentId, lockerId, 0, 0);
        //displayCountdownTimer(3);
    });

    //end user subscription to selected slotNumber
    $('#btnEndSubscription').on('click', function () {
        var lockerId = $(this).attr('data-lockerid');

        //end subcription
        manualEndSubscription(lockerId);
        
    });


});

function getLockers()
{
    var getUserUrl = "http://127.0.0.1:5000/api/v1/lockers/all";
    $.ajax({
        type: "GET",        
        url: getUserUrl,
        success: function (data) {
            // console.log(data);
            var lockerSlotHTML;
            if (data.length > 0){
                for(var item in data)
                {
                    var sizeClass = (data[item].Dimension == '100x100' ? 'buttonStyle' : 'buttonStyle-large')
                    var timerID = 'timer' + data[item].LockerID;
                    lockerSlotHTML += "<div class='div-box'>" + 
                                "<button type='button' class='" + sizeClass + "' name='button-slot' data-lockerno='" + data[item].LockerNo + "' data-lockerid='" + data[item].LockerID + "'>" + data[item].TextDisplayed + "</button>" +
                                "<div class='timerStyle' name='timer' id='" + timerID + "'>00:00</div>" +
                                "</div>"
                }
                $('#LockerSlotsContainer').empty();    
                $('#LockerSlotsContainer').html(lockerSlotHTML.replace('undefined',''));

                getAllLockerSubscriptions();
            }
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR);
            console.log(exception);
        }
      });   
}

function getAllLockerSubscriptions()
{
    var getLockerSubscriptionsUrl = "http://127.0.0.1:5000/api/v1/lockers/all-subscriptions";
    $.ajax({
        type: "GET",
        url: getLockerSubscriptionsUrl,
        success: function (data){
            console.log(data);
            console.log(data.length);

            if (data.length > 0)
            {
                for (var item in data)
                {
                    var time = timeConvert(data[item].timeRemaining);
                    var lockerId = data[item].lockerId;

                    if (data[item].timeRemaining > 0)
                        displayCountdownTimer(lockerId, time[0], time[1], time[2])
                }
            }            
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR);
            console.log(exception);
        }

    });
}

function getLockerSubscriptionDetails(lockerId, studentId)
{
    var getLockerSubscriptionUrl = "http://127.0.0.1:5000/api/v1/lockers/user-subscription";

    $.ajax({
        type: "GET",
        url: getLockerSubscriptionUrl,
        data: { "lockerId": lockerId, "studentId": studentId },
        success: function (data) {
            console.log(data);
            if (data.success)
            {
                $('#scanQRCode').modal('hide');
                $('#displayPaymentForExtend').modal('show');
                $('#btnEndSubscription').attr('data-lockerid', lockerId);
            }
            else
            {
                if (data.message.includes('Invalid'))
                {
                    $('#errorAlertMessage').text('You have no subscription on this locker!');
                    $('#displayErrorAlert').modal('show');
                }
                else 
                {
                    if (data.errorCode == 102) {
                        $('#errorAlertMessage').text(data.message);
                        $('#displayErrorAlert').modal('show');
                    }
                    else {
                        $('#btnCallConfirmation').attr('data-id', studentId);
                        $('#scanQRCode').modal('hide');
                        $('#displayPayment').modal('show');    
                    }
                }
            }
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR);
            console.log(exception);
        }
    });

}

function registerUser()
{
    var studentList = [];
    var studentId = $('#txtStudentId').val();
    var studentName = $('#txtStudentName').val();
    var contactNo = $('#txtContactNo').val();
    var course = $('#ddlCourses option:selected').val();
    var slotNo = $('#btnOpenRegister').attr('data-slot');

    var studentObj = {
        studentId: studentId,
        studentName: studentName,
        contactNo: contactNo,
        course: course,
        slotNo: slotNo
    }

    var registerUrl = "http://127.0.0.1:5000/api/v1/students/create";

    $.ajax({
        type: "GET",       
        url: registerUrl,
        data: { "studentId": studentId,
                "studentName": studentName,
                "contactNo": contactNo,
                "course": course,
                "slotNo": slotNo
        }, 
        success: function (data) {
            console.log(data);
            //studentList.push(studentObj);
            //localStorage.setItem(slotNo, JSON.stringify(studentList));

            $('#displayAlert').modal('show');
            $('#registerLockerUser').modal('hide');
            $('#scanQRCode').modal('hide');

            $('#btnCallConfirmation').attr('data-id', data.user[0][0]);
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR);
            console.log(exception);
        }
      });
}

function saveUserSubscription(studentId, lockerId, bill, time) 
{
    var userSubscribeUrl = "http://127.0.0.1:5000/api/v1/lockers/subscribe";

    $.ajax({
        type: "GET",       
        url: userSubscribeUrl,
        data: { "studentId": studentId,
                "lockerId": lockerId,
                "billAccepted": 5.00,
                "time": 3
        }, 
        success: function (data) {
            console.log(data);

            if (data.success)
                displayCountdownTimer(data.lockerId, data.time, 0, 0);
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR);
            console.log(exception);
        }
      });
}

function endUserSubscription(lockerId, isEnded)
{
    var endUserSubscriptionUrl = "http://127.0.0.1:5000/api/v1/lockers/end-subscription";
    $.ajax({
        type: "GET",       
        url: endUserSubscriptionUrl,
        data: { "lockerId": lockerId, "hasEnded": isEnded },
        success: function (data){
            console.log(data);
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR);
            console.log(exception);
        } 
    });
}

function manualEndSubscription(lockerId)
{
    //endCountdownTimer(lockerId, 1);
    var timerID = "timer" + lockerId;
    clearInterval(globalTimer[timerID]);
    endUserSubscription(lockerId, true);
    $('#' + timerID).text('00:00');
    $('#' + timerID).removeClass('timerStyleActive');
    $('#' + timerID).addClass('timerStyle');
}

// function endUserSubscription() 
// {
//     //get selected slot number
//     var slotNumber = localStorage.getItem('slotNumber');

//     //get stored list of users
//     var userList = JSON.parse(localStorage.getItem('studentObj'));

//     //remove selected slot number object from list/array.
//     var listUsers = $.grep(userList, function(v) {
//         return v.slotNo != slotNumber;
//     });

//     //store updated list<users>
//     localStorage.setItem('studentObj', listUsers);

//     //clears countdown timer
//     stopCountdownTimer();

//     //updates display timer and style
//     var elementName = "displayTime" + slotNumber;
//     document.getElementById(elementName).innerHTML = "00:00";
//     $('#' + elementName).removeClass('timerStyleActive');
//     $('#' + elementName).addClass('timerStyle');

// }

function isUserExist(slotNo)
{
    var userList;
    if (localStorage.getItem('studentObj') != null && localStorage.getItem('studentObj') != "")
    {
        userList = JSON.parse(localStorage.getItem('studentObj'));
    
        var registeredUser = $.grep(userList, function(v) {
            return v.slotNo == slotNo;
        });
    }    

    return registeredUser;
}

function getUserData(studentId)
{
    var slotLockerId = localStorage.getItem('slotNumber');
    var slotLockerNo = localStorage.getItem('slotLockerNo');
    //var userList = JSON.parse(localStorage.getItem('studentObj'));
    //console.log(userList);
    var getUserUrl = "http://127.0.0.1:5000/api/v1/students/single";
    $.ajax({
        type: "GET",        
        url: getUserUrl,
        data: { "studentId": studentId },
        success: function (data) {
            ///console.log(data);
           
            $('#txtLockerSlot').val(slotLockerNo);
            $('#txtDisplayName').val(data[0].StudentName);
            $('#txtBillAccepted').val('P5.00');
            $('#lblTime').text('3 hours');
            
            $('#btnConfirmTransaction').attr('data-userid', data[0].StudentID)
            $('#btnConfirmTransaction').attr('data-lockerid', slotLockerId)
            $('#displayConfirmation').modal('show');
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR);
            console.log(exception);
        }
      });   

}

function getScannedUserDetails(studentId, lockerId)
{
    var getUserUrl = "http://127.0.0.1:5000/api/v1/students/single";
    $.ajax({
        type: "GET",        
        url: getUserUrl,
        data: { "studentId": studentId },
        success: function (data) {
            //console.log(data);

            if (data.length > 0)
            {
                $('#lblUserName').text(data[0].StudentName);
                //
                getLockerSubscriptionDetails(lockerId, studentId);
            }
            else 
            { 
                var timerDisplay = $('#timer' + lockerId).text();
                if (timerDisplay == "00:00") {
                    $('#txtStudentId').val('');
                    $('#txtStudentName').val('');
                    $('#txtContactNo').val('');
                    //$('#txtCourse').val('');
                    PopulateCourseDropdown();

                    $('#scanQRCode').modal('hide');
                    $('#registerLockerUser').modal('show'); 
                }
                else
                {
                    $('#lblUserName').text('');
                    $('#errorAlertMessage').text('You have no subscription on this locker! Select an available locker slot and register.');
                    $('#displayErrorAlert').modal('show');
                }
            }
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR);
            console.log(exception);
        }
      });   
}

function PopulateCourseDropdown()
{
    var courseDataUrl = "http://127.0.0.1:5000/api/v1/courses/all";
    $.ajax({
        type: "GET",
        url: courseDataUrl,
        success: function (data) {
            console.log(data);
            if (data.length > 0)
            {
                $('#ddlCourses').empty();
                $('#ddlCourses').append("<option></option>");
                for (var item in data)
                {
                    $('#ddlCourses').append("<option value='" + data[item].CourseCode + "'> (" + data[item].CourseCode + ") - " + data[item].CourseName + "</option>");
                }
            }
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR);
            console.log(exception);
        }
    });
}

//Adds property functions for Date object
Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}
Date.prototype.addMinutes= function(m){
    this.setMinutes(this.getMinutes()+m)
    return this;
}
Date.prototype.addSeconds= function(s){
    this.setSeconds(this.getSeconds()+s)
    return this;
}
Date.prototype.minusHours= function(h){
    this.setHours(this.getHours()-h);
    return this;
}

// setInterval(function() {
//     $('#timer1').text((new Date - start) / 1000);
// }, 1000);

function displayCountdownTimer(lockerId, hours, minutes, seconds)
{
    var countDownDate = new Date().addHours(hours).addMinutes(minutes).addSeconds(seconds).getTime();
    
    // Update the count down every 1 second
    var timerID = "timer" + lockerId;
    globalTimer[timerID] = setInterval(function() {

        // Get today's date and time
        var now = new Date().getTime();

        // Find the distance between now and the count down date
        var distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        var elementName = "timer" + lockerId;
        document.getElementById(elementName).innerHTML = days + "d " + hours + "h "
        + minutes + "m " + seconds + "s ";

        $('#' + elementName).removeClass('timerStyle');
        $('#' + elementName).addClass('timerStyleActive');

        // If the count down is finished, write some text
        if (distance < 0) 
        {
            clearInterval(globalTimer[timerID]);
            endUserSubscription(lockerId, false);
            document.getElementById(elementName).innerHTML = "00:00";
            $('#' + elementName).removeClass('timerStyleActive');
            $('#' + elementName).addClass('timerStyle');
        }
    }, 1000);
}

function endCountdownTimer(lockerId, hours)
{
    var countDownDate = new Date().minusHours(hours).getTime();
    
    // Update the count down every 1 second
    var a = setInterval(function() {

        // Get today's date and time
        var now = new Date().getTime();

        // Find the distance between now and the count down date
        var distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        var elementName = "timer" + lockerId;
        document.getElementById(elementName).innerHTML = days + "d " + hours + "h "
        + minutes + "m " + seconds + "s ";

        $('#' + elementName).removeClass('timerStyle');
        $('#' + elementName).addClass('timerStyleActive');

        // If the count down is finished, write some text
        if (distance < 0) 
        {
            clearInterval(a);
            endUserSubscription(lockerId, true);
            document.getElementById(elementName).innerHTML = "00:00";
            $('#' + elementName).removeClass('timerStyleActive');
            $('#' + elementName).addClass('timerStyle');
        }
    }, 1000);
}

function timeConvert(totalMinutes) {
    var dataArr = [];
    var num = totalMinutes;
    var hours = (num / (60 * 60));
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    var seconds = (minutes - rminutes) * 60;
    var rseconds = Math.round(seconds);

    // var rhours = Math.floor((totalMinutes % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    // var rminutes = Math.floor((totalMinutes % (1000 * 60 * 60)) / (1000 * 60));
    // var rseconds = Math.floor((totalMinutes % (1000 * 60)) / 1000);
    
    //add to array
    dataArr.push(rhours);
    dataArr.push(rminutes);
    dataArr.push(rseconds);
    return dataArr;
}

function stopCountdownTimer()
{
    var countDownDate = new Date().getTime();

    // Update the count down every 1 second
    var x = setInterval(function() {

        // Get today's date and time
        var now = new Date().getTime();

        // Find the distance between now and the count down date
        var distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        var slotNumber = localStorage.getItem('slotNumber');
        // Display the result in the element with id="demo"
        var elementName = "displayTime" + slotNumber;
        document.getElementById(elementName).innerHTML = days + "d " + hours + "h "
        + minutes + "m " + seconds + "s ";

        $('#' + elementName).removeClass('timerStyle');
        $('#' + elementName).addClass('timerStyleActive');

        // If the count down is finished, write some text
        if (distance < 0) 
        {
            clearInterval(x);
            document.getElementById(elementName).innerHTML = "00:00";
            $('#' + elementName).removeClass('timerStyleActive');
            $('#' + elementName).addClass('timerStyle');
        }
    }, 1000);
}
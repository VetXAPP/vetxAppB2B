var videoClient;
var activeRoom;
var previewMedia;
var identity;
var roomName;

// Check for WebRTC
if (!navigator.webkitGetUserMedia && !navigator.mozGetUserMedia) {
  alert('WebRTC is not available in your browser.');
}

//nana vanthuttenu sollu 

// When we are about to transition away from this page, disconnect
// from the room, if joined.
window.addEventListener('beforeunload', leaveRoomIfJoined);

$.getJSON('/token', function (data) {
  identity = data.identity;
  // Create a Video Client and connect to Twilio
  videoClient = new Twilio.Video.Client(data.token);
 // document.getElementById('room-controls').style.display = 'block';

 $( document ).ready(function() {

  $.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results[1] || 0;
  }
  
  var petId=$.urlParam('p');
  var clinicId=$.urlParam('q');
  var callUserId=$.urlParam('r');
  var doctorId=$.urlParam('s');


  var accept_info={"accept_status":1,"user_id":callUserId,"petId":petId,
  "clinicId":clinicId,"doctorId":doctorId};

  socket.emit('accept_status',accept_info, function(data){

  });

   //activeRoom.disconnect();
   videoClient.connect({ to: callUserId}).then(roomJoined,
    function(error) {
    });


 });

  // Bind button to join room
  // document.getElementById('button-join').onclick = function () {

  //   roomName = document.getElementById('room-name').value;
  //   if (roomName) {
  //     log("Joining room '" + roomName + "'...");

  //     videoClient.connect({ to: roomName}).then(roomJoined,
  //       function(error) {
  //         log('Could not connect to Twilio: ' + error.message);
  //       });
  //   } else {
  //     alert('Please enter a room name.');


  //   }


  // };

  // Bind button to leave room
  // document.getElementById('button-leave').onclick = function () {
  //   log('Leaving room...');
  //   activeRoom.disconnect();
  //   videoClient.connect({ to: "arun"}).then(roomJoined,

  //     function(error) {
  //       log('Could not connect to Twilio: ' + error.message);

  //     });

  // };



  document.getElementById('doctorCallCut').onclick = function () {


    $.urlParam = function(name){
      var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
      return results[1] || 0;
    }
    var petId=$.urlParam('p');
    var clinicId=$.urlParam('q');
    var callUserId=$.urlParam('r');
    var doctorId=$.urlParam('s');

    var callCutInfo={"user_id":callUserId,"petId":petId,
    "clinicId":clinicId,"doctorId":doctorId};

    //alert(activeRoom);

    console.log(activeRoom);

    activeRoom.disconnect();

    socket.emit('callEndStatus',callCutInfo, function(data){

    });
    
    window.close();
  };


});

// Successfully connected!
function roomJoined(room) {


  activeRoom = room;


  //log("Joined as "+room.localParticipant.test.name);

  //document.getElementById('button-join').style.display = 'none';
  //document.getElementById('button-leave').style.display = 'inline';

  // Draw local video, if not already previewing
  if (!previewMedia) {
    room.localParticipant.media.attach('#local-media');
  }


  room.participants.forEach(function(participant) {

    //log("Already in Room: '" + room.localParticipant.test.name + "'");

    participant.media.attach('#remote-media');
    //console.log(participant);


  });



  // When a participant joins, draw their video on screen

  room.on('participantConnected', function (participant) {


   room.participants.forEach(function(participant) {

    //log("Already in Room: '" + participant.identity + "'");
    
    participant.media.attach('#remote-media');

  });


    //console.log(participant);


    // if(confirm("Appu wants to connect to you"))
    // {

      //log("Joining: '" + participant.identity + "'");

      participant.media.attach('#remote-media');


    // }
    // else
    // {

    //   activeRoom.disconnect();

    //   videoClient.connect({ to: "arun"}).then(roomJoined,

    //     function(error) {
    //       log('Could not connect to Twilio: ' + error.message);

    //     });


    // }



  });



  // When a participant disconnects, note in log
  room.on('participantDisconnected', function (participant) {


    //log("Participant '" + participant.identity + "' left the room");
    participant.media.detach();


  });

  // When we are disconnected, stop capturing local video
  // Also remove media for all remote participants
  room.on('disconnected', function () {
    //log('Left');
    room.localParticipant.media.detach();
    room.participants.forEach(function(participant) {
      participant.media.detach();
    });
    activeRoom = null;
    // document.getElementById('button-join').style.display = 'inline';
    // document.getElementById('button-leave').style.display = 'none';
  });
}

//  Local video preview
// document.getElementById('button-preview').onclick = function () {
//   if (!previewMedia) {
//     previewMedia = new Twilio.Video.LocalMedia();
//     Twilio.Video.getUserMedia().then(
//       function (mediaStream) {
//         previewMedia.addStream(mediaStream);
//         previewMedia.attach('#local-media');
//       },
//       function (error) {
//         console.error('Unable to access local media', error);
//         log('Unable to access Camera and Microphone');
//       });
//   };
// };

// Activity log
// function log(message) {
//   var logDiv = document.getElementById('log');
//   logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
//   logDiv.scrollTop = logDiv.scrollHeight;
// }

function leaveRoomIfJoined() {
  if (activeRoom) {
    activeRoom.disconnect();
  }
}





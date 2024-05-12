document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click',() => compose_email('compose',''));
  document.querySelector('#divError').style.display='none';
  

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(action,message) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').innerHTML='';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-read').innerHTML='';
  document.querySelector('#emails-read').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#msgError').innerHTML='';
  document.querySelector('#divError').style.display='none';

  // Clear out composition fields
  if (action == 'compose') {
     document.querySelector('#compose-recipients').value ='';
     document.querySelector('#compose-subject').value = '';
     document.querySelector('#compose-body').value = '';
  }
  else{
    if (action == 'reply') {
      console.log(message);
      document.querySelector('#compose-recipients').value =  message['sender'];
      subject=message['subject'];

      if (subject.substring(0,3) == "Re:") {
         document.querySelector('#compose-subject').value = message['subject'];
      }
      else{
         document.querySelector('#compose-subject').value =  'Re: '+message['subject'];
      }
      
      document.querySelector('#compose-body').value =  'On  '+message['timestamp']+" "+message['sender']
      +" wrote: "+message['body'];  
    }
  }
  
  document.querySelector("form").onsubmit=function(){
    send_mail(action);

    return false;
  };
  
}

function Reply(emailId,message){
  //console.log(message);
  compose_email('reply',message);
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-read').innerHTML='';
  document.querySelector('#emails-read').style.display = 'none';
  document.querySelector('#msgError').innerHTML='';
  document.querySelector('#divError').style.display='none'  
  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  if( mailbox=='inbox'){
    getMails();
  }
  else{
    if(mailbox=='sent'){
      getSentMails();
    }
    else{
      if(mailbox=='archive'){
        getArchived();
      }      
    }
  }
}

function send_mail(action){
    const recipient=document.querySelector("#compose-recipients").value;
    const subject=document.querySelector("#compose-subject").value;    
    const body=document.querySelector("#compose-body").value;  

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipient,
          subject: subject,
          body: body
       })
    })
    .then(function(response){ 
         if(response.ok && (action == 'compose' || action =='reply') ) {
            getSentMails();
         }
         else{
             if(response.ok && action != 'compose' ){
              getMails();
             }
             else{
               if(!response.ok){
                  throw new Error ('No se pudo acceder al buzón: '+action)
               }
             }
         }
    })
    .catch(error => {
      console.error('Error send_mail: ', error);
      document.querySelector('#divError').style.display='block';
      document.querySelector("#msgError").innerHTML="ERROR send_mail: "+error;
    });    
    
    return false;

}

function getMails(){
  fetch('/emails/inbox')
  .then(response => response.json())
  .then(emails => {
      // Print emails
      let viewReceived="<h2>Inbox</h2>";

      emails.forEach((email,index) => {
        index++;

        if (email.read===true) {
          backcolor='#d9d9d9';
        }
        else{
          backcolor='white'; 
        }  
        
        legend='Read Inbox Mail';
        origen='From';

        viewReceived=viewReceived+"<div class='row divMail' style='background-color: "+backcolor+";'><div class='col'><strong>"+email.sender+
        " </strong></div> <div class='col'><a class='linkRead' href='#'"+' onclick="readMail('+email.id+",'"+legend+"','"+origen+"');"+'">'
        +email.subject+" </a></div> <div class='col'> "+email.timestamp+
        '</div><div class="col"> <a class="btn btn-success btnArchived" href="#" onclick="setArchived('+
        email.id+');">Archive</a></div></div>';
      });

      document.querySelector("#emails-view").innerHTML=viewReceived;
  })
  .catch(error => {
    console.error('Error getMails: ', error);
    document.querySelector('#divError').style.display='block';
    document.querySelector("#msgError").innerHTML="ERROR getMails: "+error;
  });  

  return false;
}

function setArchived(idEmail){
  fetch('/emails/'+idEmail, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })
  .then(data=>{
      getMails();
  })
  .catch(error => {
    console.error('Error setArchived: '+idEmail, error);
    document.querySelector('#divError').style.display='block';
    document.querySelector("#msgError").innerHTML="Error setArchived: "+error;
  });

  return false;
}

function setUnArchived(idEmail){
  fetch('/emails/'+idEmail, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })
  .then(data=>{
      getMails();
  })
  .catch(error => {
    console.error('Error setUnArchived: '+idEmail, error);
    document.querySelector('#divError').style.display='block';
    document.querySelector("#msgError").innerHTML="ERROR: "+error;
  });

  return false;
}

function getSentMails(){
  fetch('/emails/sent')
  .then(response => response.json())
  .then(emails =>{
      // Print emails
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector("#emails-view").style.display = 'block';

      let viewSent="<h2>Sent</h2><table><tr><th>#</th><th>Destinatario</th>"+
      "<th>Asunto</th><th>Fecha</th></tr>";

      legend='Read Sent Mail';
      origen="To"

      emails.forEach((email,index) => {
        index++;
        viewSent=viewSent+"<tr><td>"+index+"</td><td>"+email.recipients+"</td><td><a href='#'"+' onclick="readMail('+email.id+",'"+legend+"','"+origen+"')"+';">'
        +email.subject+"</a></td><td>"+email.timestamp+"</td></tr>";
      });
      viewSent=viewSent+"</table>";

      document.querySelector("#emails-view").innerHTML=viewSent;
  })
  .catch(error => {
    console.error('2.- Error getSentMails: ', error);
    document.querySelector('#divError').style.display='block';
    document.querySelector("#msgError").innerHTML="2.- ERROR getSentMails: "+error;
  });  

  return false;
}

function getArchived(){
  fetch('/emails/archive')
  .then(response => response.json())
  .then(emails => {
      // Print emails
      let viewSent="<h2>Archive</h2><table><tr><th>#</th><th>Destinatario</th>"+
      "<th>Asunto</th><th>Fecha</th><th></th></tr>";

      emails.forEach((email,index) => {
        index++;
        viewSent=viewSent+"<tr><td>"+index+"</td><td>"+email.recipients+"</td><td>"
        +email.subject+"</td><td>"+email.timestamp+"</td><td><a class='btn btn-info btnUnarchive' href='#' onclick='setUnArchived("+email.id+");'>Unarchive</a></td></tr>";
      });
      viewSent=viewSent+"</table>";

      document.querySelector("#emails-view").innerHTML=viewSent;
  })
  .catch(error => {
    console.error('Error getArchived: ', error);
    document.querySelector('#divError').style.display='block';
    document.querySelector("#msgError").innerHTML="ERROR getArchived: "+error;    
  });  

  return false;
}

function readMail(email_id,legend,origen){
  fetch('/emails/'+email_id)
  .then(response => response.json())
  .then(email => {
    // Print email
    let viewSent="<h2>"+legend+"</h2><div class='container-sm'><div class='row divCabBuzon'>";
    
    document.querySelector('#emails-view').innerHTML='';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';    
       

    if(email!=''){
      let message = {'sender': email.sender, 'subject': email.subject, 
          'body': email.body, 'emailId': email.id, 'timestamp': email.timestamp};

        let p_message=JSON.stringify(message);

        if(origen=='From'){
          viewSent=viewSent+"<div class='col-sm-4 divColBuzon'><strong>"+origen+": </strong>"+ email.sender +"</div>"+
          "<div class='col-sm-2 divColBuzon'><strong>Subject: </strong>"+ email.subject +"</div>"+
          "<div class='col-sm-2 divColBuzon'><strong>Timestamp: </strong>"+ email.timestamp +
          "</div><div class='col-sm-2'> <a class='btn btn-success btnArchived' href='#' onclick='setArchived("+
          email.id+");'>Archive</a></div><div class='col-sm-2'> <a class='btn btn-info btnArchived' href='#' onclick='Reply("+
          email.id+","+p_message+");'>Reply</a></div></div>"+
          "<div class='row divBodBuzon'>"+
          "<div class='col-sm-2'><strong>Message: </strong></div>"+
          "<div class='col-sm-10'>"+ email.body +"</div> </div> </div> "; 
        }
        else{
          viewSent=viewSent+"<div class='col-sm-6 divColBuzon'><strong>"+origen+": </strong>"+ email.recipients +"</div>"+
          "<div class='col-sm-3 divColBuzon'><strong>Subject: </strong>"+ email.subject +"</div>"+
          "<div class='col-sm-3 divColBuzon'><strong>Timestamp: </strong>"+ email.timestamp +
          "</div></div><div class='row divBodBuzon'>"+
            "<div class='col-sm-2'><strong>Message: </strong></div>"+
            "<div class='col-sm-10'>"+ email.body +"</div> </div> </div> ";           
        }
 
        
        if (email.read!=true){
          fetch('/emails/'+email_id, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
          });          
        }
    }

    document.querySelector("#emails-read").innerHTML=viewSent;
    document.querySelector('#emails-read').style.display = 'block';
  
})
  .catch(error => {
    console.error('Error readMail: ', error);
    document.querySelector('#divError').style.display='block';
    document.querySelector("#msgError").innerHTML="ERROR readMail: "+error;       
  }); 
  
  return false;
}


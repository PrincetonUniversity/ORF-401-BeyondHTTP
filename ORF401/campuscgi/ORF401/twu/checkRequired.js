function checkRequired()
{   var totalrequired=0;
    var thisform = document.REGISTRATIONFORM;  
    
    var email=thisform.EMAIL.value;
    if (isBlank(email)){
      totalrequired =totalrequired + 1;
      document.images["EMAIL_REQUIRED"].src="required.gif";
    }
    else{
      document.images["EMAIL_REQUIRED"].src="required_blank.gif";
    }

    var firstname=thisform.FIRSTNAME.value;
    if (isBlank(firstname)){
      totalrequired = totalrequired + 1;
      document.images["FIRSTNAME_REQUIRED"].src="required.gif";
    }
    else{
      document.images["FIRSTNAME_REQUIRED"].src="required_blank.gif";
    }

    var lastname=thisform.LASTNAME.value;
    if (isBlank(lastname)){
      totalrequired = totalrequired + 1;
      document.images["LASTNAME_REQUIRED"].src="required.gif";
    }
    else{
      document.images["LASTNAME_REQUIRED"].src="required_blank.gif";
    }
    if (totalrequired > 0){
      var alertmessage;
      if (totalrequired == 1) alertmessage ="1";
      else if (totalrequired == 2) alertmessage ="2";
      else if (totalrequired == 3) alertmessage ="3";
      alertmessage = alertmessage + " required field(s) were left blank.";
      alertmessage = alertmessage + "Please fill-in these fields and submit again.";
      alert(alertmessage);
      return(false);
    }
    else{
      return(true);
    }
}


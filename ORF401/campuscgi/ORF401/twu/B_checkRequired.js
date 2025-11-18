function B_checkRequired()
{   var totalrequired=0;
    var thisform = document.B_REGISTRATIONFORM;  
    var hi;
    var pass1;
    var pass2;

    pass1=thisform.BPASSWORD.value;
    pass2=thisform.BREPASSWORD.value;
    if (pass1 != pass2){
      document.images["BPASSWORD_REQUIRED"].src="passdiff.gif";
      document.images["BREPASSWORD_REQUIRED"].src="passdiff.gif";
      return(false);
    }
    else{
      document.images["BPASSWORD_REQUIRED"].src="required_blank.gif";
      document.images["BREPASSWORD_REQUIRED"].src="required_blank.gif";
    }


      
    hi=thisform.BUSERNAME.value;
    if (isBlank(hi)){
      totalrequired =totalrequired + 1;
      document.images["BUSERNAME_REQUIRED"].src="required.gif";
    }
    else{
      document.images["BUSERNAME_REQUIRED"].src="required_blank.gif";
    }

    hi=thisform.BPASSWORD.value;
    if (isBlank(hi)){
      totalrequired =totalrequired + 1;
      document.images["BPASSWORD_REQUIRED"].src="required.gif";
    }
    else{
      document.images["BPASSWORD_REQUIRED"].src="required_blank.gif";
    }

    hi=thisform.BNAME.value;
    if (isNull(hi)){
      totalrequired =totalrequired + 1;
      document.images["BNAME_REQUIRED"].src="required.gif";
    }
    else{
      document.images["BNAME_REQUIRED"].src="required_blank.gif";
    }

    hi=thisform.BADDRESS.value;
    if (isNull(hi)){
      totalrequired =totalrequired + 1;
      document.images["BADDRESS_REQUIRED"].src="required.gif";
    }
    else{
      document.images["BADDRESS_REQUIRED"].src="required_blank.gif";
    }

    hi=thisform.BEMAIL.value;
    if (isBlank(hi)){
      totalrequired =totalrequired + 1;
      document.images["BEMAIL_REQUIRED"].src="required.gif";
    }
    else{
      document.images["BEMAIL_REQUIRED"].src="required_blank.gif";
    }



    if (totalrequired > 0){
      var alertmessage;
      if (totalrequired == 1) alertmessage ="1";
      else if (totalrequired == 2) alertmessage ="2";
      else if (totalrequired == 3) alertmessage ="3";
      else if (totalrequired == 4) alertmessage ="4";
      else if (totalrequired == 5) alertmessage ="5";
      alertmessage = alertmessage + " required field(s) were left blank.";
      alertmessage = alertmessage + "Please fill-in these fields and submit again.";
      alert(alertmessage);
      return(false);
    }
    else{
      return(true);
    }
}


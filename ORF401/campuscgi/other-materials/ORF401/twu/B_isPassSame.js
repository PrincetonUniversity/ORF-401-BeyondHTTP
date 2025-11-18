function B_isPassSame()
{   var theform = document.B_REGISTRATIONFORM;
    var pass1;
    var pass2;
    pass1=theform.BPASSWORD.value;
    pass2=theform.BREPASSWORD.value;
alert("Is pass same");
    if (pass1 != pass2)
    {  document.images["BPASSWORD_REQUIRED"].src="required.gif";
       document.images["BREPASSWORD_REQUIRED"].src="required.gif";
       return(false);
    }
    else
    { document.images["BPASSWORD_REQUIRED"].src="required_blank.gif";
      document.images["BREPASSWORD_REQUIRED"].src="required_blank.gif";
      return(true);
    }
}

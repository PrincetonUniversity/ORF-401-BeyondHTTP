function isNull(mystring)
{ var s=mystring;
  var t;
  var i;

  if(s==null || s=="") return (true);

  for (i = 0; i<s.length; i++ )
  { t=s.charAt(i);
    if (t=='\t' || t=='\n') return (true);
  }

  return(false);
}

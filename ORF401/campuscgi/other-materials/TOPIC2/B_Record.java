import java.util.*;public class B_Record
{
	String username, password, name, address, email;		public B_Record (String line)	{StringTokenizer st;
	 String tok;	
	 
	 st = new StringTokenizer(line, "\t");
	 try {
		 tok = st.nextToken();
		 username =tok;
		 tok = st.nextToken();
		 password = tok ;
		 tok = st.nextToken();
		 name = tok;
		 tok = st.nextToken();
		 address = tok;
		 tok = st.nextToken();
		 email = tok;
	 } catch (NoSuchElementException nsee) {
		 System.err.println("Missing entry in: "+line);
		 System.exit(2);
	 } catch (NumberFormatException nfe) {
		   System.err.println("Invalid cost in: "+line);
		   System.exit(2);
	 }
	}		public B_Record ()
	{ 
	}	
	public void setBusername (String myString)
	{ username = myString;
	}	public void setBpassword (String myString)
	{ password = myString;
	}	public void setBname (String myString)
	{ name = myString;
	}	public void setBaddress (String myString)
	{ address = myString;
	}	public void setBemail (String myString)
	{ email = myString;
	}		public String getBusername ()	{ return username;	}
	public String getBpassword ()	{ return password;	}
	public String getBname ()	{ return name;	}
	public String getBaddress ()	{ return address;	}
	public String getBemail ()	{ return email;	}
}

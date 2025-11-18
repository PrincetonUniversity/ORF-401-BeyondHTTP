import java.io.*;
import java.net.*;
import java.util.*;//import com.ms.wfc.*;
public class B_Server
{
	public static void main(String[] args)
	{ 	  	  B_Database mdb = new B_Database();
	  mdb.readDatabase("Business.dat");
	  boolean IsUserExist, IsPassCorrect;
	  
	  DataInputStream dis;
	  
	  String line, name, nvPair, query, symbol, value;	  String user="", pass="";	  
	  StringTokenizer st1, st2;
	  query = args[0];
	  	  
	  B_Record mr = new B_Record();
	  
	  // To find name-value pairs	  
	  st1 = new StringTokenizer(query, "&");
	  while (st1.hasMoreTokens()) {
		  nvPair = st1.nextToken();
		  // To split name-value pairs
		  st2 = new StringTokenizer(nvPair, "=");
		  name = st2.nextToken();
		  value = URLDecoder.decode(st2.nextToken());
		  if ( name.toLowerCase().equals("busername") ) {			  user = value;
		  } 
		  else if ( name.toLowerCase().equals("bpassword") ) {
			  pass = value;
		  }
		  else {
			  System.err.println("Error in the query string");
			  System.exit(1);
		  }
	  }	  
	  IsUserExist = mdb.searchUsername(user, pass);	  IsPassCorrect = mdb.checkPassword();
	  
	  System.out.println("<HTML>");
	  System.out.println("<BODY>");	  //System.out.println("IsUserExist="+IsUserExist+" // IsPassCorrect="+IsPassCorrect+"<P>");
	  if (IsUserExist && IsPassCorrect) 
	  { 
		System.out.println("Welcome to the Net Coupon! As a <B>registered business</B>, ");
		String myURL="http://campuscgi.princeton.edu/~rwarnold/coupons/newcoupon.html";
		String myAnchor="<A HREF= \" "+myURL+" \">Click here</A>";
		System.out.println("Please " + myAnchor +" to post your coupon.");		
	  System.out.println("<script>");
	  System.out.println(" document.cookie=\"username="+user+" ;\" ");	  System.out.println(" document.location = \""+ myURL+"\";");	  
	  System.out.println("</script>");	  }
	  else if (IsUserExist == false)
	  {	System.out.println("The username was not registered, please ");
		String myURL="http://campuscgi.princeton.edu/~twu/ORF401/BRegister.html";
		System.out.println("<A HREF= \" "+myURL+" \"> register first.</A>");		System.out.println("Or click BACK on your browser if you had a type error.");
	  }	  else if (IsPassCorrect == false)	  {	System.out.println("Your password was wrong, please ");
		String myURL="http://campuscgi.princeton.edu/~twu/ORF401/BLogin.html";
		System.out.println("<A HREF= \" "+myURL+" \"> Login again.</A>");		System.out.println("Or click BACK on your browser.");
	  }
	  System.out.println("</BODY>");
	  System.out.println("</HTML>");
	}
}

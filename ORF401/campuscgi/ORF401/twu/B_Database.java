import java.io.*;
import java.util.*;
public class B_Database
{		int totalrecord = 0;
	B_Record [] mrarray = new B_Record[1000];		
	
	public B_Database()	{ 
	}
		public boolean addMember(B_Record record)	{ 		boolean isNotExist = true;
		for (int i = 0; i<totalrecord; i++)		{  if (record.getBusername().equals( mrarray[i].getBusername()))
		   {			   isNotExist = false;			   break;
		   }		}		if (isNotExist)		{			mrarray[totalrecord]=record;			totalrecord = totalrecord + 1;
		}		return isNotExist;
	}	
	public void readDatabase(String filename)	{		BufferedInputStream bis;
		DataInputStream dis;
		FileInputStream fis;
		
		String line;
		B_Record mr;
		int count = 0;
		
		try {
			fis = new FileInputStream(filename);
			bis = new BufferedInputStream(fis);
			dis = new DataInputStream(bis);

			while ( (line=dis.readLine()) != null ) {
				mr = new B_Record(line);
				mrarray[count] = mr;
				count = count + 1;
			}
		} catch(IOException ioe) {
			System.err.println("IO Error: Business Member database file doesn't exsit.");
			System.exit(1);
		}
		totalrecord = count;	}	
	public void writeDatabase(String filename)	{   FileOutputStream    fos;
		PrintStream         ps;
				try{
			fos = new FileOutputStream(filename);
			ps = new PrintStream(fos);
			
			for (int i=0; i<totalrecord; i++)
			{	ps.print(mrarray[i].getBusername() + "\t");
				ps.print(mrarray[i].getBpassword() + "\t");
				ps.print(mrarray[i].getBname()  + "\t");
				ps.print(mrarray[i].getBaddress()  + "\t");				ps.print(mrarray[i].getBemail()  + "\t");				ps.print("\n");
			}
			
			ps.close();
			fos.close();
		}catch(IOException ioe) {
			System.err.println("IO Error: Can't write to business member database file.");
			System.exit(1);
		}	}		public int size()	{ return totalrecord;		}	 
	public boolean searchUsername(String user, String pass)	{  boolean IsUserExist = false;
	   IsPasswordCorrect = false;
	   	   for (int i=0; i<totalrecord; i++)
	   {
		   boolean uqud = user.equals( mrarray[i].getBusername());
		   		   //System.out.println("uqud="+uqud);
		   if (user.equals( mrarray[i].getBusername()))		   {		   			   IsUserExist =true;			   { 				   //System.out.println("////user="+user+"  pass="+pass+"  totalrecord="+totalrecord);
				   //System.out.println("mrarray[i].getBpassword()="+mrarray[i].getBpassword());
				   				   if (pass.equals( mrarray[i].getBpassword()))
				   {
					   //System.out.println("HAA::mrarray[i].getBpassword()="+mrarray[i].getBpassword());
					   //System.out.println("HAA::i="+i);
					   IsPasswordCorrect = true;
				   }			   }			   break;		   }
	   }	   //System.out.println("Check1::IsPasswordCorrect="+IsPasswordCorrect);
	   return IsUserExist;	}
		public boolean checkPassword()
	{  		
		//System.out.println("Check2::IsPasswordCorrect="+IsPasswordCorrect);

		return IsPasswordCorrect;	}	
	private boolean IsPasswordCorrect;	}

import java.io.*;
import java.net.*;
import java.util.*;

/**
 * ORF401 - Electronic Commerce
 *
 * The Server for a Simple TCP Socket Example
 */
public class LenseServer
{


    public static void main(String[] args)
    {
	Hashtable              db;
	LenseRequestHandler    lrh;
	Socket                 s;
	ServerSocket           ss;



	db = new Hashtable();
	readDatabase(db);

	while (true) {

           try {


		ss = new ServerSocket(8190);

		while (true) {

		    s = ss.accept();

		    lrh = new LenseRequestHandler(s, db, args[0]);

		}

	    } catch (Exception e) {

		System.err.println(e);
	    }

	}
    }



    private static void readDatabase(Hashtable db)
    {
          DataInputStream  dis;
	  Double           price;
	  String           line, product, temp;
	  StringTokenizer  st;


          try {

               dis = new DataInputStream(
                         new BufferedInputStream(
                             new FileInputStream("contacts.dat")
                         )
                      );

               while ( (line=dis.readLine()) != null) {

		   st = new StringTokenizer(line, "\t");
		   product = st.nextToken();
		   temp = st.nextToken();
		   price = Double.valueOf(temp);
		   db.put(product, price);
               }

               dis.close();

          } catch(IOException ioe) {

               System.err.println("Error reading database: "+ioe);
               ioe.printStackTrace();
               System.exit(1);
          }
     }

}

import java.io.*;
import java.net.*;
import java.util.*;


/**
 * ORF401 - Electronic Commerce
 *
 * A Supporting Class for a Simple TCP Socket Server
 */
public class LenseRequestHandler extends Thread
{

    DataInputStream        in;
    Hashtable              db;
    PrintStream            out;
    Socket                 s;
    String                 store;



     /**
      * Construct a new LenseRequestHandler
      *
      */
     public LenseRequestHandler(Socket s, Hashtable db, String store)
     {
	 this.store = store;
	 boolean ok;

	 ok = true;
	 this.s = s;
	 this.db = db;

         try {

             in  = new DataInputStream(
		       new BufferedInputStream(s.getInputStream())
                   );

             out = new PrintStream(s.getOutputStream(),true);

         } catch (IOException ioe) {

             System.err.println("Bad streams in LenseRequestHandler!");
             ok = false;
         }

	 if (ok) start();
     }






     /**
      * Run the LenseRequestHandler (i.e., process valid commands)
      *
      */
     public void run()
     {
	 boolean                done, ok;
	 Double                 price;
	 String                 cmd, product, str;
	 StringTokenizer        st;


         done = false;

         try {

             while (!done) {

                 str = in.readLine();

                 if (str == null) {

                     done = true;

                 } else {

                     st = new StringTokenizer(str,"\t");
                     cmd = st.nextToken();

                     if (cmd.equals("SEARCH")) {

                         if (st.hasMoreTokens()) {

                             product = st.nextToken();

			     price = (Double)(db.get(product));

			     if (price != null) {

				 out.println(store+"\t"+
                                             product+"\t"+
                                             price.doubleValue());

			     } else {

				 out.println("NOT FOUND \t NOT FOUND");
			     }
			     done = true;

                         } else {

                             out.println("MISSING PRODUCT");
                             done = true;
                         }

                     } else {

			 out.println("INVALID COMMAND");
			 done = true;
		     }
                 }
             }

         } catch (IOException ioe) {

             System.err.println("IO Exception in LenseRequestHandler!");
         }


	 try {

             s.close();

	 } catch (IOException ioe) {

	     // Do nothing
	     System.err.println("IO Exception in LenseRequestHandler!");
	 }
     }


}

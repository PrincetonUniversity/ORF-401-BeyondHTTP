import java.io.*;
import java.net.*;
import java.util.*;

/**
 * Registers the host and port of machines that want to be informed
 * of gate changes.
 *
*/
public class GateListenerRegistrar extends Thread
{

    DataInputStream        in;
    GateListenerDatabase   listeners;
    GateReporterBoard      board;
    InetAddress            ipAddress;
    PrintStream            out;
    Socket                 s;
    Thread                 registrarThread;



     /**
      * Construct a new GateListenerRegistrar
      *
      * @param s   The Socket to read from
      */
     public GateListenerRegistrar(Socket s, GateListenerDatabase listeners,
                                  GateReporterBoard board)
     {
	 boolean ok;

	 ok = true;
	 this.s = s;
	 this.listeners = listeners;
	 this.board = board;

         try {

             in  = new DataInputStream(new BufferedInputStream(s.getInputStream()));
             out = new PrintStream(s.getOutputStream(),true);

         } catch (IOException ioe) {

             System.err.println("Problem opening streams in GateListenerhandler!");
             ok = false;
         }

	 if (ok) start();
     }






     /**
      * Run the GateListenerRegistrar (i.e., process valid commands)
      *
      */
     public void run() 
     {
	 boolean                done, ok;
	 GateListenerRecord     glr;
	 int                    port;
	 String                 host, portString, req, str;
	 StringTokenizer        st;


         done = false;

         try {

             while (!done) {

                 str = in.readLine();

                 if (str == null) {

                     done = true;

                 } else {

                     st = new StringTokenizer(str," ");
                     req = st.nextToken();

                     if (req.equals("ADD")) {

                         if (st.hasMoreTokens()) {

                             host = st.nextToken();
			     ipAddress = InetAddress.getByName(host);

			     if (st.hasMoreTokens()) {

				 portString = st.nextToken();
				 port = Integer.valueOf(portString).intValue();

				 glr = new GateListenerRecord(host, port);
				 ok = listeners.add(glr);

				 if (ok) {

				     out.println("HELLO "+host+" "+port);
				     board.display();

				     done = true;

				 } else {

				     out.println("You failed to deregister last time!");
				     done = true;
				 }

			     } else {

				 out.println("INVALID PORT");
				 done = true;
			     }

                         } else {

                             out.println("INVALID HOST");
                             done = true;
                         }

                     } else if (req.equals("DROP")) {

			 done = true;

                         if (st.hasMoreTokens()) {

                             host = st.nextToken();

			     if (st.hasMoreTokens()) {

				 portString = st.nextToken();
				 port = Integer.valueOf(portString).intValue();
				 glr = new GateListenerRecord(host, port);
				 ok = listeners.drop(glr);
				 
				 if (ok) {

				     out.println("BYE "+host+" "+port);
				     board.display();

				 } else {

				     out.println("UNABLE TO DROP "+host+" "+port);
				 }
			     }
                         }

                     } else {

			 out.println("INVALID COMMAND");
			 done = true;
		     }
                 }
             }


	 } catch (UnknownHostException uhe) {

	     out.println("INVALID HOST");

         } catch (NumberFormatException nfe) {

             out.println("INVALID PORT");

         } catch (IOException ioe) {

             System.err.println("IO Exception in GateListenerRegistrar!");
         }


	 try {

             s.close();

	 } catch (IOException ioe) {

	     // Do nothing
	 }
     }


}

import java.io.*;
import java.net.*;
import java.util.*;


/**
 * Sends UDP packets containing gate change information to all
 * registered machines
 */
public class GateReporter extends Thread
{
    DatagramSocket         ds;
    GateListenerDatabase   listeners;
    String                 airline;
    ArrayList<String> des_code = new ArrayList<String>();

    /**
     * Construct a new GateReporter
     */
    public GateReporter(String airline, GateListenerDatabase listeners)
    {
	this.listeners = listeners;
	this.airline   = airline;

        DataInputStream  dis;
     
        try {
           dis = new DataInputStream(new BufferedInputStream(new FileInputStream("des_code.csv")));

           String in_des;
           StringTokenizer st;

           try {
               while (((in_des=dis.readLine()) != null) && (!in_des.equals(""))){
                   st = new StringTokenizer(in_des,",");
                   st.nextToken();
                   des_code.add(st.nextToken());
               }
           } catch (IOException ioe) {
               System.out.println("IOException: "+ioe);
               ioe.printStackTrace();
           }
        } catch(IOException ioe) {

           System.out.println("Error: "+ioe);
           ioe.printStackTrace();
           System.exit(1);
        }

	start();
    }


     /**
      * Close an existing connection
      *
      */
     protected void closeConnection()
     {
          if (ds != null) ds.close();
     }



     /**
      * Attempt to open a connection
      *
      * @returns  true if the connection was established and false otherwise
      */
     protected boolean openConnection()
     {
          boolean      retval;

          retval = false;

          try {

               ds = new DatagramSocket();
               retval = true;

          } catch (IOException ioes) {

               // Couldn't open the socket
               retval = false;
          }

          return retval;
     }


    /**
     * Run the GateReporter
     */
    public void run()
    {
	boolean               ok;
	byte[]                data;
	DatagramPacket        dp;
	Enumeration           e;
	GateListenerRecord    glr;
	int                   delay, des_num, gate, seat;
	Random                r;
	String                msg;


        ok = openConnection();

        while ( ok ){

	    r = new Random();

	    try {

		// Sleep between 25 and 50 seconds
		delay = Math.abs(r.nextInt())%5000+2500;
		sleep(delay);

		// Generate a random gate between 1 and 30
		gate = Math.abs(r.nextInt())%30+1;

		// Generate a random seat number between 1 and 5
		seat = Math.abs(r.nextInt())%5+1;

		// Generate a random des_num between 1 and des_code.size()
		des_num = Math.abs(r.nextInt())%des_code.size();

		msg = airline+","+des_code.get(des_num)+",SEAT,"+seat+",GATE,"+gate;
		
        //System.out.println(msg);
		data = new byte[msg.length()];
		msg.getBytes(0,msg.length(),data,0);

		e = listeners.getAll();

		while (e.hasMoreElements()) {

		    glr = (GateListenerRecord)(e.nextElement());

		    dp = new DatagramPacket(data,data.length,
                                            glr.ipAddress,glr.port);
		    ds.send(dp);
		}

	    } catch (InterruptedException ie) {

		// Do nothing

	    } catch (IOException ioe) {

		// Do nothing
	    }
	}
    }


}

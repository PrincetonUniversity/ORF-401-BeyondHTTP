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



    /**
     * Construct a new GateReporter
     */
    public GateReporter(String airline, GateListenerDatabase listeners)
    {
	this.listeners = listeners;
	this.airline   = airline;
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
	int                   delay, flight, gate;
	Random                r;
	String                msg;


        ok = openConnection();

        while ( ok ){

	    r = new Random();

	    try {

		// Sleep between 25 and 50 seconds
		delay = Math.abs(r.nextInt())%5000+2500;
		sleep(delay);

		// Generate a random gate between 1 and 50
		gate = Math.abs(r.nextInt())%51+1;

		// Generate a random flight between 1 and 10
		flight = Math.abs(r.nextInt())%101+1;

		msg = airline+" "+flight+" GATE "+gate;
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

import java.io.*;
import java.net.*;

/**
 * The Java application for Lab 5 of CIV401
 */
public class GateKeeper
{


    public static void main(String[] args)
    {	System.out.println("Starting GateKeeper...\n");		
	GateInformationBoard  cboard, vboard;
	int                   ciport, coport, viport, voport;
	Logo                  clogo, vlogo;
	String                chost, machine, vhost;


	machine = "140.180.0.119";

	chost = "orf-3p180f1.princeton.edu";
	coport = 8189;  // Port to connect to when registering
	ciport = 8190;  // Port to receive message on
	clogo = new Logo("carmonair.gif");


/*	vhost = ".princeton.edu";
	voport = 7189;  // Port to connect to when registering
	viport = 7191;  // Port to receive message on
	vlogo = new Logo("vanderfly.gif");
*/
	// Start a GateInformationBoard for vanderFLY and carmonAir

       	cboard = new GateInformationBoard(chost,   coport, 
                                          machine, ciport										  , clogo											);
	cboard.startup();



//	vboard = new GateInformationBoard(vhost,   voport, machine, viport, vlogo);
//	vboard.startup(); 


    }



}

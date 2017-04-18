import java.io.*;
import java.net.*;


public class GateListenerServer extends Thread
{
    Socket                 s;
    ServerSocket           ss;
    GateListenerDatabase   listeners;
    GateListenerRegistrar  registrar;
    GateReporterBoard      board;




    public GateListenerServer(GateListenerDatabase listeners)
    {
	this.listeners = listeners;
	board = new GateReporterBoard(listeners);
	board.show();
	start();
    }
			     



    public void run()
    {
	while (true) {

	    try {

		ss = new ServerSocket(8189);

		while (true) {

		    s = ss.accept();

		    registrar = new GateListenerRegistrar(s, listeners, board);

		}

	    } catch (Exception e) {

		System.err.println(e);
	    }

	}
    }

}

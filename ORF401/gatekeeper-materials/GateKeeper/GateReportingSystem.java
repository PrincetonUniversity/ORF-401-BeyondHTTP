import java.io.*;
import java.net.*;

public class GateReportingSystem
{

    public static void main(String args[])
    {
	Socket                 s;
	ServerSocket           ss;
	GateListenerDatabase   listeners;
	GateListenerRegistrar  registrar;
	GateListenerServer     gls;
	GateReporter           gr;
	GateReporterBoard      board;
	String                 airline;


	airline = args[0];

	listeners = new GateListenerDatabase();
	gr = new GateReporter(airline, listeners);
	gls = new GateListenerServer(listeners);

    }

}

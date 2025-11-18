import java.net.*;
import java.util.*;

/**
 * Contains information about hosts that want to receive gate information
 */
public class GateListenerRecord
{
    int              port;
    InetAddress      ipAddress;
    Date             created;
    String           host;


    /**
     * Construct a new GateListenerRecord
     */
    public GateListenerRecord(String host, int port)
    {
	this.host = host;
	this.port = port;

	try {

	    ipAddress = InetAddress.getByName(host);

	} catch (UnknownHostException uh) {

	    // Do nothing
	}

	created = new Date();
    }
}

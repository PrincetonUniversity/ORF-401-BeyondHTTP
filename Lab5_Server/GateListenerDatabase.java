import java.util.*;

/**
 * A database of GateListener objects
 */
public class GateListenerDatabase
{
    Hashtable db;



    /**
     * Construct a new GateListenerDatabase
     */
    public GateListenerDatabase()
    {
	db = new Hashtable();
    }



    /**
     * Add a GateListenerRecord to the database
     */ public boolean add(GateListenerRecord glr)
    {
	boolean            added;
	GateListenerRecord old;
	String             key;


	added = false;

	key = glr.host+":"+glr.port;
	old = (GateListenerRecord)(db.get(key));

	if (old != null) {

	    added = false;

	} else {

	    added = true;
	    db.put(key, glr);
	}

	return added;
    }




    /**
     * Drop a GateListenerRecord from the database
     */
    public boolean drop(GateListenerRecord glr)
    {
	boolean   dropped;
	Object    oldkey;
	String    key;


	key = glr.host+":"+glr.port;
	oldkey = db.remove(key);

	dropped = true;
	if (oldkey == null) dropped = false;

	return dropped;
    }



    /**
     * Returns an Enumeration containing all of the GateListenerRecord 
     * Objects in the database
     */
    public Enumeration getAll()
    {
	return db.elements();
    }






}

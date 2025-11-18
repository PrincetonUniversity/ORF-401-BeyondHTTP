import java.awt.*;
import java.awt.event.*;
import java.io.*;


/**
 * A Frame that can be closed by clicking on the
 * "window close" button.  (For use in Orf401.)
 *
 *  @version 1.1  01 February 2004
 *  @author  David Bernstein, Alain Kornhauser
 *
 *  Copyright, Princeton University
 */
public class DisposableFrame extends Frame
{


    /**
     * Construct a new DisposableFrame
     *
     * @param title    The text that should appear in the title bar
     */
    public DisposableFrame(String title)
    {

	addWindowListener(new WindowAdapter()
        {
	    public void windowClosing(WindowEvent e)
            {
		shutdown();
		dispose();
            }
        } );

	setSize(300,300);
        setTitle(title);
    }





    /**
     * Shutdown the frame
     *
     * Note: Classes that extend DisposableFrame should override
     * this method.  In general, it should include any code that
     * needs to be executed when the Frame is closed.
     */
    public void shutdown()
    {

    }





}

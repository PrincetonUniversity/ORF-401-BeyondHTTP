import java.awt.*;
import java.awt.image.*;
import java.net.*;
import java.io.*;

/**
 * A logo (or other image) that can be used like any other
 * Component. (For use in Orf401.)
 */
 
public class Logo extends Canvas
{
     private Image image;

    /**
     * Construct a new Logo
     *
     * @param fn    The name of the file containing the .png image
     */
     public Logo(String fn)
     {
          image = Toolkit.getDefaultToolkit().getImage(fn);

          MediaTracker mt = new MediaTracker(this);
          mt.addImage(image,0);

          try {

               mt.waitForID(0);

          } catch (InterruptedException ie) {

               // Do nothing
          }

          setSize(image.getWidth(null),image.getHeight(null));

     }


    /**
     * Paint this Logo
     *
     * @param g   The graphics context
     */
     public void paint (Graphics g)
     {
         g.drawImage(image,0,0,null);
     }

}

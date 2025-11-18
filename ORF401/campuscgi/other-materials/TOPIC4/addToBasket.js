/**
 * Orf401 - Electronic Commerce
 *
 * Simple script for adding an item to a shopping basket
 */
function addToBasket(type, item)
{
     document.cookie = type + "=" + item + ";" ;
}

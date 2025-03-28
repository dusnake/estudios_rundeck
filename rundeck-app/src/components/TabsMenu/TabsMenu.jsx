import Section from "../Section/Section";

export default function TabsMenu({
    buttons = <></>, 
    children = <></>, 
    ButtonsContainer = "div"
}){

    return (
        <>
           <ButtonsContainer>

                {buttons}
           </ButtonsContainer>
           
            {children}
        </>
    );
}

// TabsMenu.defaultProps = {
//     buttons: <li><button>Boton de ejemplo</button></li>, 
//     children: <p>Texto de ejemplo</p>, 
//     ButtonsContainer: "menu"
// };
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
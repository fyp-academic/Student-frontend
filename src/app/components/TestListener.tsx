import { useEffect } from "react";

export default function TestListener(){
    useEffect(() => {
       window.Echo.channel('test-channel')
            .listen('.test.event', (e: any) => {
           console.log("TestListener mounted");
       })
    }, []);
    
    return <div>Listening...</div>;
}

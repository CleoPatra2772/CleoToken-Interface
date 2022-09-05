import Web3 from "web3";

const getWeb3 = () =>{
    new Promise((resolve, reject) => {
        //wait for loading completion to avoid race conditions with web3 injection

        window.addEventListener("load", async () => {
            //modern dapp browsers
            if(window.ethereum) {
                const web3 = new Web3(window.ethereum);
                try{
                    //request account access if needed
                    await window.eth_requestAccounts();
                    //Accounts now exposed
                    console.log('Window ethereum enable', web3);
                    resolve(web3);
                }catch (error){
                    reject(error);
                }
            }
            //Legacy dapp browsers ... 
            else if (window.web3){
                //use mist/metamask provider
                const web3 = window.web3;
                console.log("Injected web3 detected");
                resolve(web3);
            }
            //fallback to localhost; use dev console port by default
            else {
                const provider =  new Web3.providers.HttpProvider(
                    "http://127.0.0.1:7545"
                );
                const web3 = new Web3(provider);
                console.log("No web3 instance injected, using Local web3.");
                resolve(web3);

            }
        });
    });
}

export default getWeb3;
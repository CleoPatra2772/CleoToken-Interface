import { useState, useEffect } from "react";
import getWeb3 from '../../getWeb3';

import {Vendor_ABI, Vendor_contractAddress } from '../contracts/ABI_Vendor';
import { ABI, contractAddress } from "../contracts/ABI_ERC20";

import Web3 from "web3";

export const Info = () => {

    const [netId, setNetworkId] = useState('');
    const [netType, setNetType] = useState('');
    const [contractOwner, setContractOwner] = useState('');
    const [activeAccount, setActiveAccount] = useState('');
    const [accountBalance, setAccountBalance] = useState('');
    const [amountBuy, setAmountbuy] = useState('');
    const [amountSell, setAmountSell] = useState('');
    const [tokenBalance, setTokenBalance] = useState('');
    const [contractBalance, setContractBalance] = useState('');
    const [contractTokenBalance, setContractTokenBalance] = useState('');
    const [owner, setOwner] = useState(false);

    const init = async() => {
        const web3 = await getWeb3();
        const netId = await web3.eth.net.getId();
        setNetworkId(netId);
        const netType = await web3.eth.net.getNetworkType();
        setNetType (netType);
        const accounts = await web3.eth.net.getAccounts();
        setActiveAccount(accounts[0]);
        const acBalance = await web3.eth.net.getBalance(accounts[0]);
        setAccountBalance(acBalance / 1e18);

    }

    const contractInfo = async () => {
        const web3 = await getWeb3();

        let contractBal = await web3.eth.net.getBalance(Vendor_contractAddress);
        contractBal = contractBal / 1e18;
        setContractBalance(contractBal);

        const tc = new web3.eth.Contract(Vendor_ABI, Vendor_contractAddress);

        const contractOwner = await tc.methods.contractOwner().call();
        console.log('contract Owner >', contractOwner);
        setContractOwner(contractOwner);

        const accounts = await web3.eth.getAccounts();
        const activeAccount = accounts[0];

        if(activeAccount === contractOwner) {
            setOwner (true)
        } else {
            setOwner (false)
        }

        const tc2 = new web3.eth.Contract(ABI, contractAddress);
        const tokenBalance = await tc2.methods.balanceOf(activeAccount).call();
        setTokenBalance(tokenBalance);

        const contractTokenBal = await tc2.methods.balanceOf(Vendor_contractAddress).call();
        setContractTokenBalance(contractTokenBal);
    }

    const buyToken = async ( buyQty ) => {

        console.log('In buyToken fn', buyQty);
        const web3 = new Web3(window.ethereum);

        if(web3 == null) {
            console.log('error - web3 object creation')
            return
        }

        let check = buyQty % 100;
        if(check !== 0){
            console.log('Error toekn quantity must be in x100', buyQty);
        }

        //convert into Ether value and into wei
        let howMuch = buyQty /100;
        let valueInWei = await web3.utils.toWei(howMuch.toString(), 'ether');
        console.log('value in Wei', valueInWei);

        const accounts = await web3.eth.getAccounts();

        const tc = new web3.eth.Contract(Vendor_ABI, Vendor_contractAddress);

        await tc.methods.buyToken().send({from: accounts[0], to: Vendor_contractAddress, value: valueInWei}, 
            (err, res) => {
                if(err) {
                    console.log('Buy token failed', err)

                    return

                } else {
                    console.log('Buy token success', res)
                }
            }).on('receipt', (receipt) => {
                console.log('But Token Receipt> ', receipt)
            })
    }

    const sellToken = async ( tokenQty ) => {
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.getAccounts();
        const tc = new web3.eth.Contract(ABI, contractAddress);
        await tc.methods.approve(Vendor_contractAddress, tokenQty).send({
            from: accounts[0],
            to: Vendor_contractAddress
        }, (err, res) => {
            if(err){
                console.log('Approval of allowance failed', tokenQty)
            }else{
                console.log('Success approval', res)
            }
        })
        //pay money to Seller
        const tc2 = new web3.eth.Contract(Vendor_ABI, Vendor_contractAddress);

        await tc2.methods.sellToken(tokenQty).send({
            from: accounts[0],
            to: Vendor_contractAddress
        }, (err, res) => {
            if(err) {
                console.log('Sell token failed', err)
                return
            }else{
                console.log('Sell token success', res);
            }
        })

    }

    const withdraw = async () => {
        try{
            const confirm = window.confirm('Withdraw all contract Ether? ');
            if(confirm == false ) return;
            const web3 = new Web3(window.ethereum);
            const contractBal = await web3.eth.getBalance(Vendor_contractAddress);

            if(contractBal <= 0){
                window.alert('Insufficent Amount');
                return
            }
            const tc= new web3.eth.Contract(Vendor_ABI, Vendor_contractAddress);
            const contractOwner = await tc.methods.contractOwner().call();

            await tc.methods.withdrawal().send({from: contractOwner, to: Vendor_contractAddress}, (err, res) => {
                if(err) {
                    console.log('Withdrawal failed', err)
                    return
                }else {
                    console.log('Withdrawal success', res)
                }
            });
            
        }catch (error) {
            console.log('error > ', error)
        }
    }

    useEffect(() => {
        init();
        contractInfo();
        
    }, []);

    return (
        <div className="info-container">
        <div className = 'title'>
            <h1>Welcome to CLEO Token</h1>
        </div>
        <div className='vendor-info'>
            <h2>BlockChain Type: {netType}</h2>
        </div>


        <div className='button-container'>
        <button className="btn" onClick = {() => {window.location.reload()}}>Refresh</button>
        <input className="inputNum" type='number' name='amountBuy' min='100' id='qtyBuy' step='100'
        value={amountBuy} onChange= {((e) => setAmountbuy(e.target.value))}></input>
        <button className="btn" onClick = {() => buyToken(amountBuy)}> Buy Token</button>



        </div>
        </div>
    )
}
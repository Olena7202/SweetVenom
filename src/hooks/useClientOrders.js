import { getOrdersByClient } from "../services/orderService";
import { useEffect, useMemo, useState } from "react";
import { products } from "../data/products";
import { getCakes, getFavoriteCakesByClient } from "../services/cakeService";
import { readClientOrders, getSavedCakeData } from "../utils/orderViewModel";

export function useClientOrdersData(clientId, savedListVersion = 0) {

 const [catalogCakes,setCatalogCakes]=useState([]);
 const [orderSource,setOrderSource]=useState({clientId:null,rows:[],failed:false});
 useEffect(()=>{
  if(!clientId) return;
  let active=true;
  getOrdersByClient(clientId).then(rows=>{if(active)setOrderSource({clientId,rows:Array.isArray(rows)?rows:[],failed:false});})
   .catch(()=>{if(active)setOrderSource({clientId,rows:[],failed:true});});
  return ()=>{active=false;};
 },[clientId]);

  useEffect(() => {
    let cancelled = false;

    getCakes()
      .then((data) => {
        if (cancelled) return;
        setCatalogCakes(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCatalogCakes([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cakesById = useMemo(() => {
    const map = new Map();
    const fromRemote = Array.isArray(catalogCakes) ? catalogCakes : [];
    const merged = [...fromRemote, ...products];

    merged.forEach((cake) => {
      const id = Number(cake?.id);
      if (!Number.isFinite(id) || map.has(id)) return;
      map.set(id, cake);
    });

    return map;
  }, [catalogCakes]);

  if (!clientId) return { orders: [], savedCakes: [] };
  void savedListVersion; // keeps explicit refresh when user removes favorite


 const savedItems=getFavoriteCakesByClient(clientId);
 const localOrders=readClientOrders(clientId);
 const currentSource=Number(orderSource.clientId)===Number(clientId)?orderSource:null;
 const remoteIds=new Set((currentSource?.rows||[]).map(order=>String(order.id)));
 const mergedOrders=[
 ...(currentSource?.rows||[]).map(order=>{
  const cached=localOrders.find(item=>String(item.id)===String(order.id))||{};
  const first=order.orderItems?.[0];
  return {...cached,...order,date:order.createdAt||cached.date,
   cakeName:first?.cake?.name||order.cake?.name||cached.cakeName||"Замовлення",
   cakeImage:first?.cake?.photoUrl||order.cake?.photoUrl||cached.cakeImage,
   total:order.totalPrice??cached.total??0,
   quantity:order.orderItems?.length?order.orderItems.reduce((sum,item)=>sum+(Number(item.quantity)||1),0):cached.quantity||1,
   cakeBasePrice:first?.cake?.basePrice??cached.cakeBasePrice,note:order.note ?? order.comment ?? order.notes ?? cached.note};
 }),
 ...localOrders.filter(order=>!remoteIds.has(String(order.id)))
 ].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  return {
    orders: mergedOrders,
    loadingOrders:!currentSource, ordersUnavailable:currentSource?.failed||false,
    savedCakes: savedItems.map((saved) => {
      const savedCakeId = Number(saved?.cake?.id ?? saved?.cakeId ?? saved?.id);
      const fallbackCake = Number.isFinite(savedCakeId) ? cakesById.get(savedCakeId) : null;
      return getSavedCakeData(saved, fallbackCake);
    }),
  };
}

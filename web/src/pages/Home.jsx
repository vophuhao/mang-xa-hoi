import DestinationGrid from "../components/DestinationGrid"
import Footer from "../components/Footer"
import Header from "../components/Header"
import HomeBanner from "../components/HomeBanner"
import TopDestinations from "../components/TopDestinations"



const Home = () =>{

    return (

        <>
            <Header/>
            <HomeBanner/>
            <TopDestinations/>
            <DestinationGrid/>
            <Footer/>
            
        </>
    )
}

export default Home
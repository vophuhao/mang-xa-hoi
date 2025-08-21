import Sidebar from "../components/SideBar"





const Home = () => {

    return (

        <>
            <div className="flex">
                <Sidebar/>
                {/* Nội dung chính */}
                <div className="flex-1 p-10">
                    <h2 className="text-xl font-semibold">Gợi ý cho bạn</h2>
                </div>
            </div>
        </>
    )
}

export default Home
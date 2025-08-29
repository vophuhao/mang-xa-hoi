import landingImg_1 from "../../assets/images/landingImg_1.png";

const BackgroundImage = () => {
  return (
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[1.5px]"
      style={{
        backgroundImage: `url(${landingImg_1})`,
      }}
    >
      {/* <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-pink-200/20 to-orange-200/20"></div> */}
    </div>
  );
};

export default BackgroundImage;

const Divider = ({ text = "or" }) => (
  <div className="my-6 flex items-center">
    <div className="border-border flex-1 border-t"></div>
    <span className="text-muted-foreground px-4 text-sm">{text}</span>
    <div className="border-border flex-1 border-t"></div>
  </div>
);

export default Divider;

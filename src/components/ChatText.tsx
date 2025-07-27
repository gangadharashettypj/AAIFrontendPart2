import React from "react";
import blackboard from "./../images/blackboard.png";
import Image from "next/image";

interface ChalkTextProps {
  text: string;
}

const ChalkText: React.FC<ChalkTextProps> = ({ text }) => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        margin: "auto",
        height: "auto",
      }}
    >
      <Image
        src={blackboard}
        alt="Blackboard"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />
      <p
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "90%",
          fontFamily: "Chalk",
          fontSize: 26,
          color: "#fff",
          textAlign: "center",
          userSelect: "none",
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
};

export default ChalkText;

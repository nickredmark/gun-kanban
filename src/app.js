import React, { useEffect } from "react";
import { hot } from "react-hot-loader/root";

import { GunBoard } from "./components/GunBoard";

require("gun/lib/open");

const App = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const hashUrlParams = new URLSearchParams(window.location.hash.substr(1));
  const priv = hashUrlParams.get("priv");
  const epriv = hashUrlParams.get("epriv");

  useEffect(() => {
    if (!id) {
      window.location = `https://gun-create.nmaro.now.sh?next=${encodeURIComponent(
        window.location.origin
      )}`;
    }
  }, []);

  if (!id) {
    return <div>Loading...</div>;
  }

  return <GunBoard id={id} priv={priv} epriv={epriv} />;
};

export default hot(App);

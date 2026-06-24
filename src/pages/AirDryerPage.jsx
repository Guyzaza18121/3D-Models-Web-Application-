import AirDryer from "../components/AirDryer";

export default function AirDryerPage({ airDryer, toggleAirDryer, permissions }) {
  return <AirDryer airDryer={airDryer} toggleAirDryer={toggleAirDryer} permissions={permissions} />;
}

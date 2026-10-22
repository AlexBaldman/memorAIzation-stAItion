// ROLL//99 | Parametric two-d10 design | Units: millimeters
// Run: openscad -o ROLL99_TENS_d10.stl -D 'role="TENS"' ROLL99_d10.scad
role = "TENS"; // "TENS" or "ONES"
digit_depth = 0.72; // mm; 0.45-0.85 recommended
digit_size = 7.0;
corner_rounding = 0.38;
body_scale = 0.978;
$fn = 12;
module raw_die(){
  polyhedron(points = [
    [0.0000000, 0.0000000, 14.2798016],
    [0.0000000, 0.0000000, -14.2798016],
    [0.0000000, 14.2000000, 1.5075588],
    [-8.3465506, 11.4880413, -1.5075588],
    [-13.5050025, 4.3880413, 1.5075588],
    [-13.5050025, -4.3880413, -1.5075588],
    [-8.3465506, -11.4880413, 1.5075588],
    [-0.0000000, -14.2000000, -1.5075588],
    [8.3465506, -11.4880413, 1.5075588],
    [13.5050025, -4.3880413, -1.5075588],
    [13.5050025, 4.3880413, 1.5075588],
    [8.3465506, 11.4880413, -1.5075588],
  ], faces = [
    [0,2,3],
    [0,3,4],
    [0,4,5],
    [0,5,6],
    [0,6,7],
    [0,7,8],
    [0,8,9],
    [0,9,10],
    [0,10,11],
    [0,11,2],
    [5,4,3],
    [5,3,1],
    [7,6,5],
    [7,5,1],
    [9,8,7],
    [9,7,1],
    [11,10,9],
    [11,9,1],
    [3,2,11],
    [3,11,1],
  ], convexity=10);
}
module softened_body(){
  minkowski(){ scale([body_scale, body_scale, body_scale]) raw_die();
    sphere(r=corner_rounding); }
}
module numerals(){
  // face 0, numeral 0, top hemisphere
  multmatrix(m=[[-0.80901699, 0.39307569, -0.43701602, -5.50877083], [-0.58778525, -0.54102227, 0.60150096, 7.58217257], [0.00000000, 0.74349607, 0.66874030, 4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("0", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
  // face 1, numeral 1, top hemisphere
  multmatrix(m=[[0.30901699, 0.63600982, -0.70710678, -8.91337843], [-0.95105652, 0.20665212, -0.22975292, -2.89613221], [0.00000000, 0.74349607, 0.66874030, 4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("1", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
  // face 2, numeral 2, top hemisphere
  multmatrix(m=[[1.00000000, 0.00000000, -0.00000000, -0.00000000], [-0.00000000, 0.66874030, -0.74349607, -9.37208071], [0.00000000, 0.74349607, 0.66874030, 4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("2", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
  // face 3, numeral 3, top hemisphere
  multmatrix(m=[[0.30901699, -0.63600982, 0.70710678, 8.91337843], [0.95105652, 0.20665212, -0.22975292, -2.89613221], [0.00000000, 0.74349607, 0.66874030, 4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("3", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
  // face 4, numeral 4, top hemisphere
  multmatrix(m=[[-0.80901699, -0.39307569, 0.43701602, 5.50877083], [0.58778525, -0.54102227, 0.60150096, 7.58217257], [0.00000000, 0.74349607, 0.66874030, 4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("4", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
  // face 5, numeral 6, bottom hemisphere
  multmatrix(m=[[0.47887581, -0.52026720, -0.70710678, -8.91337843], [-0.54025110, -0.80953217, 0.22975292, 2.89613221], [-0.69195860, 0.27199210, -0.66874030, -4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("6", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
  // face 6, numeral 5, bottom hemisphere
  multmatrix(m=[[0.66179010, 0.60913944, -0.43701602, -5.50877083], [0.28849119, -0.74496271, -0.60150096, -7.58217257], [-0.69195860, 0.27199210, -0.66874030, -4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("5", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
  // face 7, numeral 9, bottom hemisphere
  multmatrix(m=[[-0.06986704, 0.89673608, 0.43701602, 5.50877083], [0.71854846, 0.34911990, -0.60150096, -7.58217257], [-0.69195860, 0.27199210, -0.66874030, -4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("9", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
  // face 8, numeral 8, bottom hemisphere
  multmatrix(m=[[-0.70497030, -0.05492607, 0.70710678, 8.91337843], [0.15559618, 0.96073067, 0.22975292, 2.89613221], [-0.69195860, 0.27199210, -0.66874030, -4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("8", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
  // face 9, numeral 7, bottom hemisphere
  multmatrix(m=[[-0.36582857, -0.93068225, 0.00000000, 0.00000000], [-0.62238473, 0.24464431, 0.74349607, 9.37208071], [-0.69195860, 0.27199210, -0.66874030, -4.11413092], [0.00000000, 0.00000000, 0.00000000, 1.00000000]]) {
    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)
      text("7", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");
    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)
      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",
        halign="center", valign="center", spacing=0.93);
  }
}
difference(){ softened_body(); numerals(); }
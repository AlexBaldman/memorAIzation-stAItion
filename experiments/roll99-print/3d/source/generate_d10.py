#!/usr/bin/env python3
"""Generate reproducible, parametric ROLL//99 d10 OpenSCAD geometry.

Geometry: the face-transitive pentagonal trapezohedron (10 congruent kite faces).
Centering/planarity is enforced analytically; ring vertices and apices share a
circumsphere to keep tumbling characteristics sensible. Engraving is shallow.
"""
from __future__ import annotations
import math
import numpy as np
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'source'; SOURCE.mkdir(exist_ok=True)
RADIUS=14.2 # ring radial mm
COS=math.cos(math.radians(36))
K=(1+COS)/(1-COS)
HEIGHT=RADIUS/math.sqrt(1-1/K**2)
Z=HEIGHT/K
SCALE=0.978
ROUND=0.38

vertices = [np.array([0.,0., HEIGHT]),np.array([0.,0.,-HEIGHT])]
for i in range(10):
    a=math.pi/2 + i*math.pi/5
    vertices.append(np.array([RADIUS*math.cos(a),RADIUS*math.sin(a),Z if i%2==0 else -Z]))
faces=[]
for i in range(0,10,2):
    faces.append([0,2+i,2+(i+1)%10,2+(i+2)%10])
for i in range(1,10,2):
    faces.append([1,2+i,2+(i+1)%10,2+(i+2)%10])

facenormals=[]; centers=[]
for f in faces:
    v=[vertices[j] for j in f]
    n=np.cross(v[1]-v[0],v[2]-v[0]); n/=np.linalg.norm(n)
    center=sum(v)/4
    if np.dot(center,n)<0:
        f.reverse(); n=-n
    # coplanarity test
    assert max(abs(np.dot(p-v[0],n)) for p in v)<1e-8
    facenormals.append(n); centers.append(center)

# Place digits so that opposing normals carry pairs summing to 9.
labels=[None]*10
pairs=[]; remaining=set(range(10))
for i in range(10):
    if i not in remaining: continue
    j=min((j for j in remaining if j!=i),key=lambda j: np.dot(facenormals[i],facenormals[j]))
    assert np.dot(facenormals[i],facenormals[j]) < -0.99
    remaining.remove(i); remaining.remove(j)
    pairs.append((i,j))
for pair,numbers in zip(pairs,[(0,9),(1,8),(2,7),(3,6),(4,5)]):
    labels[pair[0]],labels[pair[1]]=numbers

# Use a common print aesthetic, with subtle role mark on every facet.
def fmt(v): return '['+', '.join(f'{float(x):.7f}' for x in v)+']'
lines=[]
lines += ['// ROLL//99 | Parametric two-d10 design | Units: millimeters',
          '// Run: openscad -o ROLL99_TENS_d10.stl -D \'role="TENS"\' ROLL99_d10.scad',
          'role = "TENS"; // "TENS" or "ONES"',
          'digit_depth = 0.72; // mm; 0.45-0.85 recommended',
          'digit_size = 7.0;',
          f'corner_rounding = {ROUND};',
          f'body_scale = {SCALE};',
          '$fn = 12;',
          'module raw_die(){',
          '  polyhedron(points = [',
          *('    '+fmt(p)+',' for p in vertices),
          '  ], faces = [',
          *('    ['+','.join(map(str,t))+'],' for f in faces for t in ([f[0],f[1],f[2]],[f[0],f[2],f[3]])),
          '  ], convexity=10);',
          '}',
          'module softened_body(){',
          '  minkowski(){ scale([body_scale, body_scale, body_scale]) raw_die();',
          '    sphere(r=corner_rounding); }',
          '}',
          'module numerals(){']
for i,(face,normal,center,label) in enumerate(zip(faces,facenormals,centers,labels)):
    pole=vertices[face[0]]
    yy=(pole-center); yy-=np.dot(yy,normal)*normal; yy/=np.linalg.norm(yy)
    xx=np.cross(yy,normal); xx/=np.linalg.norm(xx)
    assert np.dot(np.cross(xx,yy),normal)>.999
    pos = center*SCALE + normal*ROUND
    # 4x4 transform, columns are the world-space local basis
    mat=np.eye(4)
    mat[:3,0]=xx; mat[:3,1]=yy; mat[:3,2]=normal; mat[:3,3]=pos
    matrix='['+', '.join('['+', '.join(f'{x:.8f}' for x in row)+']' for row in mat)+']'
    lines.extend([
       f'  // face {i}, numeral {label}, {"top" if face[0]==0 else "bottom"} hemisphere',
       f'  multmatrix(m={matrix}) {{',
       '    translate([0,1.25,-digit_depth]) linear_extrude(height=digit_depth+0.3)',
       f'      text("{label}", size=digit_size, font="Liberation Sans:style=Bold", halign="center", valign="center");',
       '    translate([0,-4.85,-digit_depth*0.68]) linear_extrude(height=digit_depth*0.68+0.3)',
       '      text(role == "TENS" ? "X10" : "X1", size=2.0, font="Liberation Sans:style=Bold",',
       '        halign="center", valign="center", spacing=0.93);',
       '  }'
    ])
lines += ['}', 'difference(){ softened_body(); numerals(); }']
(SOURCE/'ROLL99_d10.scad').write_text('\n'.join(lines)+'\n')
print('faces',len(faces),'opposites',pairs,'digit assignment',labels)
print('radius mm',RADIUS,'height mm',HEIGHT,'z mm',Z)
/**
 * Snaps the vertices and segments of a {@link Geometry}
 * to another Geometry's vertices.
 * A snap distance tolerance is used to control where snapping is performed.
 * Snapping one geometry to another can improve
 * robustness for overlay operations by eliminating
 * nearly-coincident edges
 * (which cause problems during noding and intersection calculation).
 * Too much snapping can result in invalid topology
 * beging created, so the number and location of snapped vertices
 * is decided using heuristics to determine when it
 * is safe to snap.
 * This can result in some potential snaps being omitted, however.
 *
 * @author Martin Davis
 * @version 1.7
 *
 * @requires jsts/geom/util/GeometryTransformer.js
 */

/**
 * @constructor
 */
jsts.operation.overlay.snap.GeometrySnapper = function(srcGeom) {
  this.srcGeom = srcGeom;
};
jsts.operation.overlay.snap.GeometrySnapper.SNAP_PRECISION_FACTOR = 1e-9;

/**
 * Snaps two geometries together with a given tolerance.
 * 
 * @param g0
 *          a geometry to snap.
 * @param g1
 *          a geometry to snap.
 * @param snapTolerance
 *          the tolerance to use.
 * @return the snapped geometries.
 */
jsts.operation.overlay.snap.GeometrySnapper.snap = function(g0, g1,
    snapTolerance) {
  var snapGeom = [];

  var snapper0 = new jsts.operation.overlay.snap.GeometrySnapper(g0);

  alert('Före snapTo');

  snapGeom[0] = snapper0.snapTo(g1, snapTolerance);

  alert('Efter snapTo');
  /**
   * Snap the second geometry to the snapped first geometry (this strategy
   * minimizes the number of possible different points in the result)
   */
  snapper1 = new jsts.operation.overlay.snap.GeometrySnapper(g1);
  snapGeom[1] = snapper1.snapTo(snapGeom[0], snapTolerance);

  return snapGeom;

};

/**
 * Snaps the vertices in the component {@link LineString}s of the source
 * geometry to the vertices of the given snap geometry.
 * 
 * @param snapGeom
 *          a geometry to snap the source to.
 * @return a new snapped Geometry.
 */
jsts.operation.overlay.snap.GeometrySnapper.prototype.snapTo = function(
    snapGeom, snapTolerance) {
  alert('Inne i jsts.operation.overlay.snap.GeometrySnapper.prototype.snapTo');
  snapPts = this.extractTargetCoordinates(snapGeom);
  alert('efter extractTargetCoordinates');

  var snapTrans = new jsts.operation.overlay.snap.SnapTransformer(
      snapTolerance, snapPts);
  alert('efter snapTrans');

  return snapTrans.transform(this.srcGeom);
};

/**
 * Snaps the vertices in the component {@link LineString}s of the source
 * geometry to the vertices of the given snap geometry.
 * 
 * @param snapGeom
 *          a geometry to snap the source to.
 * @return a new snapped Geometry.
 */
jsts.operation.overlay.snap.GeometrySnapper.prototype.snapToSelf = function(
    snapTolerance, cleanResult) {
  snapPts = this.extractTargetCoordinates(this.srcGeom);

  snapTrans = new jsts.operation.overlay.snap.GeometrySnapper.SnapTransformer(
      snapTolerance, snapPts, true);
  snappedGeom = snapTrans.transform(this.srcGeom);
  result = snappedGeom;
  if (cleanResult && result instanceof Polygonal) {
    // TODO: use better cleaning approach
    result = snappedGeom.buffer(0);
  }
  return result;
};

jsts.operation.overlay.snap.GeometrySnapper.prototype.extractTargetCoordinates = function(
    g) {
  // TODO: should do this more efficiently. Use CoordSeq filter to get points,
  // KDTree for uniqueness & queries
  var ptSet = new javascript.util.TreeSet();
  var pts = g.getCoordinates();
  for ( var i = 0; i < pts.length; i++) {
    ptSet.add(pts[i]);
  }
  return ptSet.toArray();
  // return ptSet.toArray(new Coordinate[0]);
};


/**
 * @constructor
 * @returns {jsts.operation.overlay.snap.SnapTransformer}
 */
jsts.operation.overlay.snap.SnapTransformer = function() {
  if (arguments.length === 2) {
    this.snapTolerance = arguments[0];
    this.snapPts = arguments[1];
    this.isSelfSnap = false;
  } else {
    this.snapTolerance = arguments[0];
    this.snapPts = arguments[1];
    this.isSelfSnap = isSelfSnap;
  }

};

jsts.operation.overlay.snap.SnapTransformer.prototype = new jsts.geom.util.GeometryTransformer();

jsts.operation.overlay.snap.SnapTransformer.constructor = jsts.operation.overlay.snap.SnapTransformer;

jsts.operation.overlay.snap.SnapTransformer.prototype.transformCoordinates = function(
    coords, parent) {
  //var srcPts = coords.toCoordinateArray();
//  var newPts = this.snapLine(srcPts, snapPts);
  var newPts = this.snapLine(coords, snapPts);
  
  return this.factory.getCoordinateSequenceFactory().create(newPts);
};
jsts.operation.overlay.snap.SnapTransformer.prototype.snapLine = function(
    srcPts, snapPts) {
  var snapper = new LineStringSnapper(srcPts, snapTolerance);
  snapper.setAllowSnappingToSourceVertices(isSelfSnap);

  return snapper.snapTo(snapPts);
};

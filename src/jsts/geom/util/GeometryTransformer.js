/**
 * A framework for processes which transform an input {@link Geometry} into
 * an output {@link Geometry}, possibly changing its structure and type(s).
 * This class is a framework for implementing subclasses
 * which perform transformations on
 * various different Geometry subclasses.
 * It provides an easy way of applying specific transformations
 * to given geometry types, while allowing unhandled types to be simply copied.
 * Also, the framework ensures that if subcomponents change type
 * the parent geometries types change appropriately to maintain valid structure.
 * Subclasses will override whichever <code>transformX</code> methods
 * they need to to handle particular Geometry types.
 * <p>
 * A typically usage would be a transformation class that transforms <tt>Polygons</tt> into
 * <tt>Polygons</tt>, <tt>LineStrings</tt> or <tt>Points</tt>, depending on the geometry of the input
 * (For instance, a simplification operation).
 * This class would likely need to override the {@link #transformMultiPolygon(MultiPolygon, Geometry)transformMultiPolygon}
 * method to ensure that if input Polygons change type the result is a <tt>GeometryCollection</tt>,
 * not a <tt>MultiPolygon</tt>.
 * <p>
 * The default behaviour of this class is simply to recursively transform
 * each Geometry component into an identical object by deep copying down
 * to the level of, but not including, coordinates.
 * <p>
 * All <code>transformX</code> methods may return <code>null</code>,
 * to avoid creating empty or invalid geometry objects. This will be handled correctly
 * by the transformer.   <code>transform<i>XXX</i></code> methods should always return valid
 * geometry - if they cannot do this they should return <code>null</code>
 * (for instance, it may not be possible for a transformLineString implementation
 * to return at least two points - in this case, it should return <code>null</code>).
 * The {@link #transform(Geometry)transform} method itself will always
 * return a non-null Geometry object (but this may be empty).
 *
 * @version 1.7
 *
 * @see GeometryEditor
 */

/**
 * @constructor
 */
jsts.geom.util.GeometryTransformer = function() {
  /**
   * Possible extensions: getParent() method to return immediate parent e.g. of
   * LinearRings in Polygons
   */

  this.inputGeom = null;

  this.factory = null;

  // these could eventually be exposed to clients
  /**
   * <code>true</code> if empty geometries should not be included in the
   * result
   */
  this.pruneEmptyGeometry = true;

  /**
   * <code>true</code> if a homogenous collection result from a
   * {jsts.geom.GeometryCollection} should still be a general GeometryCollection
   */
  this.preserveGeometryCollectionType = true;

  /**
   * <code>true</code> if the output from a collection argument should still
   * be a collection
   */
  this.preserveCollections = false;

  /**
   * <code>true</code> if the type of the input should be preserved
   */
  this.preserveType = true;

};

jsts.geom.util.GeometryTransformer.prototype.getCoordinateSequence = function(
    geom) {
  throw new jsts.error.NotImplementedError();
};

/**
 * Utility function to make input geometry available
 * 
 * @return {jsts.geom.Geometry} the input geometry.
 */
jsts.geom.util.GeometryTransformer.prototype.getInputGeometry = function() {
  return this.inputGeom;
};

jsts.geom.util.GeometryTransformer.prototype.transform = function(inputGeom) {
  this.inputGeom = inputGeom;
  this.factory = inputGeom.getFactory();

  if (inputGeom instanceof jsts.geom.Point) {
    return this.transformPoint(inputGeom, null);
  }
  if (inputGeom instanceof jsts.geom.LinearRing) {
    return this.transformLinearRing(inputGeom, null);
  }
  if (inputGeom instanceof jsts.geom.LineString) {
    return this.transformLineString(inputGeom, null);
  }
  if (inputGeom instanceof jsts.geom.MultiLineString) {
    return this.transformMultiLineString(inputGeom, null);
  }
  if (inputGeom instanceof jsts.geom.MultiPoint) {
    return this.transformMultiPoint(inputGeom, null);
  }
  if (inputGeom instanceof jsts.geom.Polygon) {
    return this.transformPolygon(inputGeom, null);
  }
  if (inputGeom instanceof jsts.geom.MultiPolygon) {
    return this.transformMultiPolygon(inputGeom, null);
  }
  if (inputGeom instanceof jsts.geom.GeometryCollection) {
    return this.transformGeometryCollection(inputGeom, null);
  }
};

/**
 * Convenience method which provides standard way of creating a
 * {@link CoordinateSequence}
 * 
 * @param coords
 *          the coordinate array to copy.
 * @return a coordinate sequence for the array.
 */
jsts.geom.util.GeometryTransformer.prototype.createCoordinateSequence = function(
    coords) {
  throw new jsts.error.NotImplementedError();
};

/**
 * Convenience method which provides standard way of copying
 * {@link CoordinateSequence}s
 * 
 * @param seq
 *          the sequence to copy.
 * @return a deep copy of the sequence.
 */
jsts.geom.util.GeometryTransformer.prototype.copy = function(seq) {
  return seq.clone();
};

/**
 * Transforms a {Coordinate[]} This method should always return a valid
 * coordinate list for the desired result type. (E.g. a coordinate list for a
 * LineString must have 0 or at least 2 points). If this is not possible, return
 * an empty sequence - this will be pruned out.
 * 
 * @param {Coordinate[]}
 *          coords the coordinates to transform.
 * @param parent
 *          the parent geometry.
 * @return the transformed coordinates.
 */
jsts.geom.util.GeometryTransformer.prototype.transformCoordinates = function(
    coords, parent) {
  return this.copy(coords);
};

jsts.geom.util.GeometryTransformer.prototype.transformPoint = function(geom,
    parent) {
  throw new jsts.error.NotImplementedError();
};

jsts.geom.util.GeometryTransformer.prototype.transformMultiPoint = function(
    geom, parent) {
  var transGeomList = new javascript.util.ArrayList();
  for ( var i = 0; i < geom.getNumGeometries(); i++) {
    var transformGeom = this.transformPoint(geom.getGeometryN(i), geom);
    if (transformGeom === null) {
      continue;
    }
    if (transformGeom.isEmpty()) {
      continue;
    }
    transGeomList.add(transformGeom);
  }
  return this.factory.buildGeometry(transGeomList);
};

/**
 * Transforms a LinearRing. The transformation of a LinearRing may result in a
 * coordinate sequence which does not form a structurally valid ring (i.e. a
 * degnerate ring of 3 or fewer points). In this case a LineString is returned.
 * Subclasses may wish to override this method and check for this situation
 * (e.g. a subclass may choose to eliminate degenerate linear rings)
 * 
 * @param {jsts.geom.LinearRing}
 *          geom the ring to simplify.
 * @param {jsts.geom.Polygon}
 *          parent the parent geometry.
 * @return {jsts.geom.LinearRing} a LinearRing if the transformation resulted in
 *         a structurally valid ring.
 * @return {jsts.geom.LineString} a LineString if the transformation caused the
 *         LinearRing to collapse to 3 or fewer points.
 */
jsts.geom.util.GeometryTransformer.prototype.transformLinearRing = function(
    geom, parent) {
  var seq = this.transformCoordinates(geom.components);
  var seqSize = seq.length;
  // ensure a valid LinearRing
  if (seqSize > 0 && seqSize < 4 && !this.preserveType) {
    return this.factory.createLineString(seq);
  }
  return this.factory.createLinearRing(seq);

};

/**
 * Transforms a LineString geometry.
 * 
 * @param {jsts.geom.LineString}
 *          geom a LineString.
 * @param {jsts.geom.Geometry}
 *          parent a Geometry.
 * @return {jsts.geom.LineString}
 */
jsts.geom.util.GeometryTransformer.prototype.transformLineString = function(
    geom, parent) {
  // should check for 1-point sequences and downgrade them to points
  return this.factory.createLineString(this.transformCoordinates(geom
      .getCoordinates(), geom));
};

jsts.geom.util.GeometryTransformer.prototype.transformMultiLineString = function(
    geom, parent) {
  var transGeomList = new javascript.util.ArrayList();
  for ( var i = 0; i < geom.getNumGeometries(); i++) {
    transformGeom = this.transformLineString(geom.getGeometryN(i), geom);
    if (transformGeom === null) {
      continue;
    }
    if (transformGeom.isEmpty()) {
      continue;
    }
    transGeomList.add(transformGeom);
  }
  return this.factory.buildGeometry(transGeomList);
};

jsts.geom.util.GeometryTransformer.prototype.transformPolygon = function(geom,
    parent) {
  var isAllValidLinearRings = true;
  shell = this.transformLinearRing(geom.getExteriorRing(), geom);

  if (shell === null || !(shell instanceof jsts.geom.LinearRing) ||
      shell.isEmpty()) {
    isAllValidLinearRings = false;
  }

  var holes = new javascript.util.ArrayList();
  for ( var i = 0; i < geom.getNumInteriorRing(); i++) {
    var hole = this.transformLinearRing(geom.getInteriorRingN(i), geom);
    if (hole === null || hole.isEmpty()) {
      continue;
    }
    if (!(hole instanceof jsts.geom.LinearRing)) {
      isAllValidLinearRings = false;
    }
    holes.add(hole);
  }

  if (isAllValidLinearRings) {
    return this.factory.createPolygon(shell, holes.toArray());
    // return this.factory.createPolygon(shell, holes);
  } else {
    var components = new javascript.util.ArrayList();
    if (shell !== null) {
      components.add(shell);
    }
    components.addAll(holes);
    return this.factory.buildGeometry(components);
  }
};

jsts.geom.util.GeometryTransformer.prototype.transformMultiPolygon = function(
    geom, parent) {
  var transGeomList = new javascript.util.ArrayList();

  for ( var i = 0; i < geom.getNumGeometries(); i++) {
    var transformGeom = this.transformPolygon(geom.getGeometryN(i), geom);
    if (transformGeom === null) {
      continue;
    }
    if (transformGeom.isEmpty()) {
      continue;
    }
    transGeomList.add(transformGeom);
  }
  return this.factory.buildGeometry(transGeomList);
};

jsts.geom.util.GeometryTransformer.prototype.transformGeometryCollection = function(
    geom, parent) {
  var transGeomList = new javascript.util.ArrayList();
  for ( var i = 0; i < geom.getNumGeometries(); i++) {
    var transformGeom = this.transform(geom.getGeometryN(i));
    if (transformGeom === null) {
      continue;
    }
    if (pruneEmptyGeometry && transformGeom.isEmpty()) {
      continue;
    }
    transGeomList.add(transformGeom);
  }
  if (preserveGeometryCollectionType) {
    return this.factory.createGeometryCollection(jsts.geom.GeometryFactory
        .toGeometryArray(transGeomList));
  }
  return this.factory.buildGeometry(transGeomList);
};
